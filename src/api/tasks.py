from __future__ import absolute_import, unicode_literals
import random
from celery.decorators import task
from search.models import Address, Runs
from django.utils import timezone#
import time

@task(name="analyse_address")
def analyse_address(address):
    from .apps import AddressAnalyser
    if Address.objects.filter(address=address).exists():
        address_obj = Address.objects.get(address=address)
    else:
        address_obj = Address.objects.create(
            address=address,
            last_updated=timezone.now(),
            update_state="address_created",
            date_created=timezone.now()
            
            )
    address_obj.update_state = "fetching_data"
    address_obj.save()

    aa = AddressAnalyser(address)
    if aa.status == "completed":
        if aa.n_tx > 0:
            n_tx = aa.n_tx
            n_stx = aa.n_stx
            n_rtx = aa.n_rtx
            sent_tx_hashes = len(aa.sent_tx_hashes)
            rcvd_tx_hashes = len(aa.recieved_tx_hashes)

            address_obj.update_state = "analysing"
            address_obj.save()

            time_threshold = timezone.now() - timezone.timedelta(hours=2)

            if not address_obj.runs_set.filter(date_time__gt=time_threshold).exists():
                from .apps import Evaluate
                evaluate = Evaluate(n_stx, n_rtx, sent_tx_hashes, rcvd_tx_hashes)

                address_obj.update_state = "adding_run"
                address_obj.save()

                Runs.objects.create(address=address_obj, percentage=evaluate.prediction, transaction_count=n_tx)
                address_obj.last_updated = timezone.now()
                
            address_obj.update_state = "completed"
            address_obj.save()
        else:
            address_obj.update_state = "adding_run"
            address_obj.save()

            Runs.objects.create(address=address_obj, percentage=0, transaction_count=aa.n_tx)

            address_obj.update_state = "completed"
            address_obj.save()
    elif aa.status == "rate_limit_exceeded":
        address_obj.update_state = "rate_limited"
        address_obj.save()



    elif aa.status == "rate_limit_exceeded":
        address_obj.update_state = "rate_limited"
        address_obj.save()



from django.shortcuts import render
from django.http import JsonResponse
from django.utils import timezone
from .tasks import analyse_address
from search.models import Address, Runs
import random

# Create your views here.

def analyse_address_view(request, *args, **kwargs):
    if request.POST.get('address', False):
        address = request.POST.get('address', None)
        task_running = request.POST.get('task_id', False)
        
        print(task_running)
        if request.method == "POST" or request.method == "GET":
            if Address.objects.filter(address=address):
                address_obj = Address.objects.get(address=address)
            else:
                address_obj = Address.objects.create(
                address=address,
                last_updated=timezone.now(),
                update_state="address_created",
                date_created=timezone.now()            
                )

            time_threshold = timezone.now() - timezone.timedelta(minutes=1)

            recent_run = address_obj.runs_set.filter(date_time__gt=time_threshold).exists()
            last_updated = address_obj.last_updated
            if not recent_run and not task_running:
                update_state = "fetching_data"
            else:
                update_state = address_obj.update_state
            date_created = address_obj.date_created

            json = {"last_updated": last_updated,
                    "update_state": update_state,
                    "date_created": date_created,
                    "runs": [

                    ]
                }

            if task_running != False:
                json["task_id"] = task_running
                task_running = True

            if not recent_run and not task_running:
                print("adding task")
                task = analyse_address.delay(address)
                json["task_id"] = task.id
            
            runs = Runs.objects.filter(address=address_obj).order_by('-date_time')[:5]

            for run in runs:
                json["runs"].append(
                    {
                        "date": run.date_time.strftime("%d/%m/%y %I:%M %p"),
                        "percentage": run.percentage,
                        "transactions": run.transaction_count
                    }
                )

            

            return JsonResponse(json)
    else:
        message = "No address supplied"
        return JsonResponse(status=404, data={'status':'false','message':message})
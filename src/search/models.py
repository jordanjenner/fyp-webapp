from django.db import models

# Create your models here.

class Address(models.Model):
    address = models.CharField(max_length=35, primary_key=True)
    last_updated = models.DateTimeField()
    date_created = models.DateTimeField()
    update_state = models.CharField(max_length=15)

class Runs(models.Model):
    address = models.ForeignKey('Address', on_delete=models.CASCADE)
    percentage = models.IntegerField()
    transaction_count = models.IntegerField()
    date_time = models.DateTimeField(auto_now=True)
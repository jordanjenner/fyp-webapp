from django.shortcuts import render
from django.http import JsonResponse
import random

# Create your views here.

def analyse_address(request, address, *args, **kwargs):
    percent = random.randint(0, 100)/100
    json = {'percentage': percent}
    return JsonResponse(json)
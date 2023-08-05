from django.urls import path
from warlock.views import index,play

urlpatterns=[
    path("",index,name="index"),
    path("play/",play,name="play"),
]

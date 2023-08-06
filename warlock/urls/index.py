from django.urls import path,include
from warlock.views.index import index


urlpatterns=[
    path("",index,name="index"),
    path("menu/",include("warlock.urls.menu.index")),
    path("playground/",include("warlock.urls.playground.index")),
    path("settings/",include("warlock.urls.settings.index")),
]

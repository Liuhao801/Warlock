from django.urls import path
from warlock.views.settings.getinfo import getinfo
from warlock.views.settings.login import signin
from warlock.views.settings.logout import signout
from warlock.views.settings.register import register


urlpatterns=[
    path("getinfo/",getinfo,name="settings_getinfo"),
    path("login/",signin,name="settings_login"),
    path("logout/",signout,name="settings_logout"),
    path("register/",register,name="settings_register"),
]

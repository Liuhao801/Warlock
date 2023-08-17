from django.shortcuts import redirect,reverse
from django.core.cache import cache
import requests
from django.contrib.auth.models import User
from warlock.models.player.player import Player
from rest_framework_simplejwt.tokens import RefreshToken


def receive_code(request):
    data=request.GET
    code=data.get('code')
    state=data.get('state')

    if not cache.has_key(state):
        return redirect("index")
    cache.delete(state)

    apply_access_token_url="https://www.acwing.com/third_party/api/oauth2/access_token/"
    params={
        'appid':'5846',
        'secret':'0ff52557279e468fafd494d0e4dbc42a',
        'code':code
    }

    access_token_res=requests.get(apply_access_token_url,params=params).json()
    access_token=access_token_res['access_token']
    openid=access_token_res['openid']

    players=Player.objects.filter(openid=openid)
    if players.exists():  #用户已存在,可直接登录
        refresh = RefreshToken.for_user(players[0].user)
        return redirect(reverse("index")+"?access=%s&refresh=%s" % (str(refresh.access_token),str(refresh)))

    get_userinfo_url="https://www.acwing.com/third_party/api/meta/identity/getinfo/"
    params={
        'access_token':access_token,
        'openid':openid
    }
    userinfo_res=requests.get(get_userinfo_url,params=params).json()
    username=userinfo_res['username']
    photo=userinfo_res['photo']

    while User.objects.filter(username=username).exists():  #使用户名不重复
        username+=str(randint(0,9))

    user=User.objects.create(username=username)
    player=Player.objects.create(user=user,photo=photo,openid=openid)

    refresh = RefreshToken.for_user(user)
    return redirect(reverse("index")+"?access=%s&refresh=%s" % (str(refresh.access_token),str(refresh)))



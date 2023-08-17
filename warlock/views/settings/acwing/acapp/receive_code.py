from django.http import JsonResponse
from django.core.cache import cache
import requests
from django.contrib.auth.models import User
from warlock.models.player.player import Player
from random import randint
from rest_framework_simplejwt.tokens import RefreshToken

def receive_code(request):
    data=request.GET

    if "errcode" in data:  #用户拒绝授权
        return JsonResponse({
            'result':'apply failed',
            'errcode':data['errcode'],
            'errmsg':data['errmsg'],
        })

    code=data.get('code')
    state=data.get('state')

    if not cache.has_key(state):
        return JsonResponse({
            'result':'state not exist'
        })

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
         player=players[0]
         refresh = RefreshToken.for_user(player.user)
         return JsonResponse({
             'result':'success',
             'username':player.user.username,
             'photo':player.photo,
             'refresh': str(refresh),
             'access': str(refresh.access_token),
        })

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
    return JsonResponse({
        'result':'success',
        'username':player.user.username,
        'photo':player.photo,
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    })



from django.http import JsonResponse
from warlock.models.player.player import Player


def getinfo_acapp(request):
    player=Player.objects.all()[0]  #第一名玩家
    return JsonResponse({
        'result':'success',
        'username':player.user.username,
        'photo':player.photo,
    })


def getinfo_web(request):
    user=request.user
    if not user.is_authenticated:  #判断user是否登录
        return JsonResponse({
                'result':'未登录',
            })
    else:
        player = Player.objects.get(user=user)
        return JsonResponse({
            'result':'success',
            'username':player.user.username,
            'photo':player.photo,
            })



def getinfo(request):
    platform=request.GET.get('platform')
    if platform=="ACAPP":
        return getinfo_acapp(request)
    elif platform=="WEB":
        return getinfo_web(request)


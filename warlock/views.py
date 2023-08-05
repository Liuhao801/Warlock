from django.http import HttpResponse

def index(request):
    line1='<h1 style="text-align:center">术士之战</h1>'
    line4='<a href="/play/">进入游戏</a>'
    line3='<hr>'
    line2='<img src="https://tse4-mm.cn.bing.net/th/id/OIP-C.92Tfu8esCrb7vlvXUTrWHAHaEr?w=239&h=180&c=7&r=0&o=5&dpr=1.6&pid=1.7" width=1000>'
    return HttpResponse(line1+line4+line3+line2)

def play(request):
    line1='<h1 style="text-align:center">游戏界面</h1>'
    line4='<a href="/">返回</a>'
    line3='<hr>'
    line2='<img src="https://cdn.acwing.com/media/file_system/file/application/icon/01be01554421020000019ae93ff35c.jpg1280w_1l_2o_100sh_LBjQxh6.jpg" width=1000>'
    return HttpResponse(line1+line4+line3+line2)

from django.http import JsonResponse
from django.contrib.auth import authenticate,login

def signin(request):
    data=request.GET
    username=data.get("username","")
    password=data.get("password","")

    if not username:
        return JsonResponse({
            'result':'用户名不能为空'
        })

    if not password:
        return JsonResponse({
            'result':'密码不能为空'
        })

    user=authenticate(username=username,password=password)
    if not user:
        return JsonResponse({
            'result':'用户名或密码不正确'
        })

    login(request,user)  #登录成功
    return JsonResponse({
        'result':'success'
    })

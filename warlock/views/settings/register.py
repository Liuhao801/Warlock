from rest_framework.views import APIView
from rest_framework.response import Response
from django.contrib.auth.models import User
from warlock.models.player.player import Player


class PlayerView(APIView):
    def post(self,request):
        data=request.POST
        username=data.get("username","").strip()  #去除首尾空格
        password=data.get("password","").strip()
        password_confirm=data.get("password_confirm","").strip()

        if not username:
            return Response({
                'result':'用户名不能为空'
            })

        if not password:
            return Response({
                'result':'密码不能为空'
            })

        if password != password_confirm:
            return Response({
                'result':'两次密码不一致'
            })

        if User.objects.filter(username=username).exists():
            return Response({
                'result':'用户名已存在'
            })

        user=User(username=username)
        user.set_password(password)
        user.save()

        Player.objects.create(user=user,photo="https://img1.imgtp.com/2023/08/05/rzALM4Ou.png")

        return Response({
            'result':'success'
        })

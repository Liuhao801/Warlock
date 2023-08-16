from django.db import models
from django.contrib.auth.models import User

#继承django的User并添加头像属性
class Player(models.Model):
    user=models.OneToOneField(User,on_delete=models.CASCADE)  #player与User一一对应,User删除时也删除对应的player
    photo=models.URLField(max_length=256,blank=True)  #头像链接,可以是空的
    openid=models.CharField(default="",max_length=50,blank=True,null=True)
    score=models.IntegerField(default=1500)


    def __str__(self):  #返回player用户名
        return str(self.user)

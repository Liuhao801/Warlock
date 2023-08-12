from channels.generic.websocket import AsyncWebsocketConsumer
import json
from django.conf import settings
from django.core.cache import cache



class MultiPlayer(AsyncWebsocketConsumer):
    async def connect(self):  #建立连接
        self.room_name=None

        for i in range(1000):
            name="room-%d"%(i)
            if not cache.has_key(name) or len(cache.get(name))<settings.ROOM_CAPACITY:  #找房间
                self.room_name=name
                break

        if not self.room_name:  #找房间失败
            return

        await self.accept()

        if not cache.has_key(self.room_name):  #创建新房间
            cache.set(self.room_name,[],3600)  #有效期1h

        for player in cache.get(self.room_name):  #向该玩家发送房间内所有玩家信息
            await self.send(text_data=json.dumps({
                'event':'create_player',
                'uuid':player['uuid'],
                'username':player['username'],
                'photo':player['photo'],
            }))

        await self.channel_layer.group_add(self.room_name, self.channel_name)

    async def disconnect(self, close_code):  #断开连接
        print('disconnect')
        await self.channel_layer.group_discard(self.room_name, self.channel_name)



    async def create_player(self,data):
        players=cache.get(self.room_name)  #加入新玩家
        players.append({
            'uuid':data['uuid'],
            'username':data['username'],
            'photo':data['photo'],
        })
        cache.set(self.room_name,players,3600)  #有效期1h

        await self.channel_layer.group_send(  #向房间内所有玩家发送新玩家的信息
            self.room_name,
            {
                'type':'group_create_player',  #接受广播的函数名
                'event':'create_player',
                'uuid':data['uuid'],
                'username':data['username'],
                'photo':data['photo'],
            }
        )

    async def group_create_player(self,data):
        await self.send(text_data=json.dumps(data))


    async def receive(self, text_data):  #接受信息
        data = json.loads(text_data)
        event=data['event']
        if event=='create_player':
            await self.create_player(data)


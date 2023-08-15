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
                'type':'group_send_event',  #接受广播的函数名
                'event':'create_player',
                'uuid':data['uuid'],
                'username':data['username'],
                'photo':data['photo'],
            }
        )

    async def move_to(self,data):
        await self.channel_layer.group_send(
            self.room_name,
            {
                'type':'group_send_event',
                'event':'move_to',
                'uuid':data['uuid'],
                'tx':data['tx'],
                'ty':data['ty'],
            }
        )

    async def shoot_ball(self,data):
        await self.channel_layer.group_send(
                self.room_name,
                {
                    'type':'group_send_event',
                    'event':'shoot_ball',
                    'uuid':data['uuid'],
                    'tx':data['tx'],
                    'ty':data['ty'],
                    'ball_type':data['ball_type'],
                    'ball_uuid':data['ball_uuid'],
                }
            )

    async def attack(self,data):
        await self.channel_layer.group_send(
                self.room_name,
                {
                    'type':'group_send_event',
                    'event':'attack',
                    'uuid':data['uuid'],
                    'attackee_uuid':data['attackee_uuid'],
                    'x':data['x'],
                    'y':data['y'],
                    'angle':data['angle'],
                    'damage':data['damage'],
                    'ball_type':data['ball_type'],
                    'ball_uuid':data['ball_uuid'],
                }
            )

    async def flash(self,data):
        await self.channel_layer.group_send(
                self.room_name,
                {
                    'type':'group_send_event',
                    'event':'flash',
                    'uuid':data['uuid'],
                    'tx':data['tx'],
                    'ty':data['ty'],
                }
            )

    async def message(self,data):
        await self.channel_layer.group_send(
                self.room_name,
                {
                    'type':'group_send_event',
                    'event':'message',
                    'uuid':data['uuid'],
                    'username':data['username'],
                    'text':data['text'],
                }
            )

    async def group_send_event(self,data):  #广播事件
        await self.send(text_data=json.dumps(data))


    async def receive(self, text_data):  #接受信息
        data = json.loads(text_data)
        event=data['event']
        if event=='create_player':
            await self.create_player(data)
        elif event=='move_to':
            await self.move_to(data)
        elif event=='shoot_ball':
            await self.shoot_ball(data)
        elif event=='attack':
            await self.attack(data)
        elif event=="flash":
            await self.flash(data)
        elif event=="message":
            await self.message(data)

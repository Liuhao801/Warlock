from channels.generic.websocket import AsyncWebsocketConsumer
import json
from django.conf import settings
from django.core.cache import cache


from thrift import Thrift
from thrift.transport import TSocket
from thrift.transport import TTransport
from thrift.protocol import TBinaryProtocol

from matching_system.src.match_server.match_service import Match
from warlock.models.player.player import Player
from channels.db import database_sync_to_async


class MultiPlayer(AsyncWebsocketConsumer):
    async def connect(self):  #建立连接
        user=self.scope['user']
        if user.is_authenticated:
            await self.accept()
        else:
            await self.close()


    async def disconnect(self, close_code):  #断开连接
        if hasattr(self,'room_name') and self.room_name:
            await self.channel_layer.group_discard(self.room_name, self.channel_name)


    async def create_player(self,data):
        self.room_name=None
        self.uuid=data['uuid']  #用于找所在房间名

        # Make socket
        transport = TSocket.TSocket('127.0.0.1', 9090)

        # Buffering is critical. Raw sockets are very slow
        transport = TTransport.TBufferedTransport(transport)

        # Wrap in a protocol
        protocol = TBinaryProtocol.TBinaryProtocol(transport)

        # Create a client to use the protocol encoder
        client = Match.Client(protocol)

        def db_get_player():
            return Player.objects.get(user__username=data['username'])

        player= await database_sync_to_async(db_get_player)()

        # Connect!
        transport.open()

        client.add_player(player.score,data['uuid'],data['username'],data['photo'],self.channel_name)

        # Close!
        transport.close()


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
        if not self.room_name:
            return
        players=cache.get(self.room_name)

        if not players:
            return

        for player in players:
            if player['uuid']==data['attackee_uuid']:
                if data['ball_type']=='fireball':
                    player['hp']-=25
                elif data['ball_type']=='iceball':
                    player['hp']-=20

        remain_cnt=0
        for player in players:
            if player['hp']>0:
                remain_cnt+=1

        if remain_cnt>1:
            if self.room_name:
                cache.set(self.room_name,players,3600)
        else:
            def db_update_player_score(username,score):
                player=Player.objects.get(user__username=username)
                player.score+=score
                player.save()

            for player in players:
                if player['hp']<=0:
                    await database_sync_to_async(db_update_player_score)(player['username'],-5)
                else:
                    await database_sync_to_async(db_update_player_score)(player['username'],10)

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
        if not self.room_name:
            keys=cache.keys('*%s*'%(self.uuid))  #找所在房间名
            if keys:
                self.room_name=keys[0]

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

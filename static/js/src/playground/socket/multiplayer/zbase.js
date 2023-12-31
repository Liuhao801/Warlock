class MultiPlayerSocket{
    constructor(playground){
        this.playground=playground;
        this.ws=new WebSocket("wss://app5846.acapp.acwing.com.cn/wss/multiplayer/?token="+playground.root.access);
        this.uuid="";
        this.start();
    }

    start(){
        this.receive();
    }

    receive(){
        let outer=this;
        this.ws.onmessage=function(e){  //接受后端的信息
            let data=JSON.parse(e.data);
            let uuid=data.uuid;
            if(uuid===outer.uuid)return false;

            let event=data.event;
            if(event==="create_player"){
                outer.receive_create_player(uuid,data.username,data.photo);
            }else if(event==="move_to"){
                outer.receive_move_to(uuid,data.tx,data.ty);
            }else if(event==="shoot_ball"){
                outer.receive_shoot_ball(uuid,data.tx,data.ty,data.ball_type,data.ball_uuid);
            }else if(event==="attack"){
                outer.receive_attack(uuid,data.attackee_uuid,data.x,data.y,data.angle,data.damage,data.ball_type,data.ball_uuid);
            }else if(event==="flash"){
                outer.receive_flash(uuid,data.tx,data.ty);
            }else if(event==="message"){
                outer.receive_message(data.username,data.text);
            }
        };
    }

    send_create_player(username,photo){
        let outer=this;
        this.ws.send(JSON.stringify({
            'event':'create_player',
            'uuid':outer.uuid,
            'username':username,
            'photo':photo,
        }));
    }

    receive_create_player(uuid,username,photo){
        let player = new Player(
            this.playground,
            this.playground.width/2/this.playground.scale,
            0.5,
            0.05,
            "snow",
            0.2,
            'enemy',
            username,
            photo
        );
        player.uuid=uuid;
        this.playground.players.push(player);
    }

    get_player(uuid){  //根据uuid找对应的player
        let players=this.playground.players;
        for(let i=0;i<players.length;i++){
            let player=players[i];
            if(player.uuid===uuid){
                return player;
            }
        }
        return null;
    }

    send_move_to(tx,ty){
        let outer=this;
        this.ws.send(JSON.stringify({
            'event':'move_to',
            'uuid':outer.uuid,
            'tx':tx,
            'ty':ty,
        }));
    }

    receive_move_to(uuid,tx,ty){
        let player=this.get_player(uuid);
        if(player){  //该玩家未掉线
            player.move_to(tx,ty);
        }
    }

    send_shoot_ball(tx,ty,ball_type,ball_uuid){
        let outer=this;
        this.ws.send(JSON.stringify({
            'event':'shoot_ball',
            'uuid':outer.uuid,
            'tx':tx,
            'ty':ty,
            'ball_type':ball_type,
            'ball_uuid':ball_uuid,
        }));
    }

    receive_shoot_ball(uuid,tx,ty,ball_type,ball_uuid){
        let player=this.get_player(uuid);
        if(player){
            let ball=player.shoot_ball(tx,ty,ball_type);
            ball.uuid=ball_uuid;  //统一所有窗口的uuid
        }
    }

    send_attack(attackee_uuid,x,y,angle,damage,ball_type,ball_uuid){
        let outer=this;
        this.ws.send(JSON.stringify({
            'event':'attack',
            'uuid':outer.uuid,
            'attackee_uuid':attackee_uuid,
            'x':x,
            'y':y,
            'angle':angle,
            'damage':damage,
            'ball_type':ball_type,
            'ball_uuid':ball_uuid,
        }));
    }

    receive_attack(uuid,attackee_uuid,x,y,angle,damage,ball_type,ball_uuid){
        let attacker=this.get_player(uuid);  //攻击者
        let attackee=this.get_player(attackee_uuid);  //被攻击者
        if(attacker && attackee){
            attackee.receive_attack(x,y,angle,damage,ball_type,ball_uuid,attacker);
        }

    }

    send_flash(tx,ty){
        let outer=this;
        this.ws.send(JSON.stringify({
            'event':'flash',
            'uuid':outer.uuid,
            'tx':tx,
            'ty':ty,
        }));
    }

    receive_flash(uuid,tx,ty){
        let player=this.get_player(uuid);
        if(player){
            player.do_flash(tx,ty);
        }
    }

    send_message(username,text){
        let outer=this;
        this.ws.send(JSON.stringify({
            'event':'message',
            'uuid':outer.uuid,
            'username':username,
            'text':text,
        }));
    }

    receive_message(username,text){
        this.playground.chat_field.add_message(username,text);
    }
}

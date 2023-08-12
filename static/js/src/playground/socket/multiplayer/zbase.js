class MultiPlayerSocket{
    constructor(playground){
        this.playground=playground;
        this.ws=new WebSocket("wss://app5846.acapp.acwing.com.cn/wss/multiplayer/");
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
    }
}

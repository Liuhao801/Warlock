class Ball extends GameObject{
    constructor(playground,player,x,y,vx,vy,type){
        super();
        this.playground=playground;
        this.player=player;  //所属的玩家
        this.ctx=this.playground.game_map.ctx;
        this.x=x;
        this.y=y;
        this.vx=vx;
        this.vy=vy;
        this.type=type;  //球的类型

        this.radius=this.playground.height*0.01;  //半径
        this.move_length=this.playground.height*1;  //射程

        this.damage=0;//伤害
        this.color="";
        this.speed=0;

        this.eps=0.1;

        this.start();
    }

    start(){
        if(this.type==="fireball"){  //四发一个
            this.color="#FF4500";
            this.speed=this.playground.height*0.5;
            this.damage=this.playground.height*0.01;
        }else if(this.type==="iceball"){  //减速、五发一个
            this.color="#146EA6";
            this.speed=this.playground.height*0.4;
            this.damage=this.playground.height*0.008;
        }else if(this.type==="lightningball"){  //一击必杀
            this.color="#4DFFFB";
            this.speed=this.playground.height*4;
            this.damage=this.playground.height*0.04;
            this.move_length=this.playground.height*2;
        }
    }

    update(){
        if(this.move_length<this.eps){
            this.destory();
            return false;
        }
        let moved=Math.min(this.move_length,this.speed*this.timedelta/1000);
        this.x+=this.vx*moved;
        this.y+=this.vy*moved;
        this.move_length-=moved;

        for(let i=0;i<this.playground.players.length;i++){
            let player=this.playground.players[i];
            if(player!==this.player && this.is_collision(player)){  //不是球的发射者 && 击中一名玩家
                this.attack(player);  //则攻击该玩家
            }
        }

        this.render();
    }

    get_dist(x1,y1,x2,y2){
        let dx=x1-x2;
        let dy=y1-y2;
        return Math.sqrt(dx*dx+dy*dy);
    }

    is_collision(player){  //是否击中player
        let distance=this.get_dist(this.x,this.y,player.x,player.y);
        if(distance<this.radius+player.radius)
            return true;
        return false;
    }

    attack(player){  //攻击player
        let angle=Math.atan2(player.y-this.y,player.x-this.x);
        player.is_attacked(angle,this.damage,this.type);  //攻击方向和伤害和类型
        this.destory();
    }


    render(){
        this.ctx.beginPath();
        this.ctx.arc(this.x,this.y,this.radius,0,Math.PI*2,false);
        this.ctx.fillStyle=this.color;
        this.ctx.fill();
    }
}

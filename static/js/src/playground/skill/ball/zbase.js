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

        this.radius=0.01;  //半径
        this.move_length=1;  //射程

        this.damage=0;//伤害
        this.color="";
        this.speed=0;

        this.eps=0.01;

        this.start();
    }

    start(){
        if(this.type==="fireball"){  //四发一个
            this.color="#FF4500";
            this.speed=0.5;
            this.damage=0.01;
        }else if(this.type==="iceball"){  //减速、五发一个
            this.color="#146EA6";
            this.speed=0.4;
            this.damage=0.008;
        }
    }

    update(){
        if(this.move_length<this.eps){
            this.destroy();
            return false;
        }

        this.update_move();
        if(this.player.character!="enemy"){  //只处理自己发射的球
            this.update_attack();
        }

        this.render();
    }

    update_move(){
        let moved=Math.min(this.move_length,this.speed*this.timedelta/1000);
        this.x+=this.vx*moved;
        this.y+=this.vy*moved;
        this.move_length-=moved;

    }

    update_attack(){
        for(let i=0;i<this.playground.players.length;i++){
            let player=this.playground.players[i];
            if(player!==this.player && this.is_collision(player)){  //不是球的发射者 && 击中一名玩家
                this.attack(player);  //则攻击该玩家
                break;  //只攻击一名玩家
            }
        }
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

        if(this.playground.mode==="multi_mode"){
            this.playground.mps.send_attack(player.uuid,player.x,player.y,angle,this.damage,this.type,this.uuid);
        }
        this.destroy();
    }


    render(){
        let scale=this.playground.scale;
        this.ctx.beginPath();
        this.ctx.arc(this.x*scale,this.y*scale,this.radius*scale,0,Math.PI*2,false);
        this.ctx.fillStyle=this.color;
        this.ctx.fill();
    }

    on_destroy(){
        let balls=this.player.balls;
        for(let i=0;i<balls.length;i++){
            if(balls[i]===this){
                balls.splice(i,1);
                break;
            }
        }
    }
}

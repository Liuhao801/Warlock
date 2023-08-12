class Player extends GameObject{
    constructor(playground,x,y,radius,color,speed,character,username,photo){
        super();
        this.playground=playground;
        this.ctx=this.playground.game_map.ctx;
        this.x=x;
        this.y=y;
        this.vx=0;  //x轴移动方向
        this.vy=0;  //y轴移动方向
        this.move_length=0;  //需要移动的距离
        this.radius=radius;  //圆的半径
        this.color=color;
        this.speed=speed;
        this.character=character;  //me,enemy,robot
        this.username=username;
        this.photo=photo;
        this.spent_time=0;  //创建后经过的时间

        this.damage_x=0;
        this.damage_y=0;
        this.damage_speed=0;  //受到伤害后的移动速度
        this.friction=this.playground.friction;  //地形的摩擦力

        this.eps=0.01  //浮点精度

        this.cur_skill=null;  //当前选中的技能(fireball,iceball,lightningball,flash)

        if(this.character!=='robot'){
            this.img = new Image();
            this.img.src = this.photo;
        }
    }

    start(){
        if(this.character==="me"){  //只监听自己的鼠标操作
            this.add_listening_events();
        }else if(this.character==="robot"){  //随机移动
            let tx=Math.random()*this.playground.width/this.playground.scale;
            let ty=Math.random()*this.playground.height/this.playground.scale;
            this.move_to(tx,ty);
        }
    }

    add_listening_events(){
        let outer=this;
        this.playground.game_map.$canvas.on("contextmenu",function(){  //关闭右键菜单功能
            return false;
        });
        this.playground.game_map.$canvas.mousedown(function(e){
            const rect=outer.ctx.canvas.getBoundingClientRect();
            const tx=(e.clientX-rect.left)/outer.playground.scale,ty=(e.clientY-rect.top)/outer.playground.scale;  //转化为画布的相对坐标
            if(e.which===3){  //点击鼠标右键
                outer.move_to(tx,ty);
            }else if(e.which===1 && outer.spent_time>4){  //点击左键
                if(outer.cur_skill==="fireball"){
                    outer.shoot_ball(tx,ty,"fireball");
                }else if(outer.cur_skill==="iceball"){
                    outer.shoot_ball(tx,ty,"iceball");
                }else if(outer.cur_skill==="lightningball"){
                    outer.shoot_ball(tx,ty,"lightningball");
                }else if(outer.cur_skill==="flash"){
                    outer.do_flash(tx,ty);
                }

                outer.cur_skill=null;
            }
        });

        $(window).keydown(function(e){
            if(e.which===81){  //Q键
                outer.cur_skill="fireball";
                return false;
            }else if(e.which===87){  //W键
                outer.cur_skill="iceball";
                return false;
            }else if(e.which===69){  //E键
                outer.cur_skill="lightningball";
                return false;
            }else if(e.which===70){  //F键
                outer.cur_skill="flash";
                return false;
            }
        });
    }

    shoot_ball(tx,ty,type){  //发射球
        let x=this.x,y=this.y;
        let angle=Math.atan2(ty-y,tx-x);
        let vx=Math.cos(angle),vy=Math.sin(angle);
        new Ball(this.playground,this,x,y,vx,vy,type);
    }

    do_flash(tx,ty){  //闪现
        let angle=Math.atan2(ty-this.y,tx-this.x);  //arctan(y,x)
        this.vx=Math.cos(angle);
        this.vy=Math.sin(angle);
        this.x+=this.vx*0.2;
        this.y+=this.vy*0.2;

        this.vx=this.vy=0;
        this.move_length=0;
    }

    get_dist(x1,y1,x2,y2){
        let dx=x1-x2;
        let dy=y1-y2;
        return Math.sqrt(dx*dx+dy*dy);
    }

    move_to(tx,ty){
        this.move_length=this.get_dist(this.x,this.y,tx,ty);
        let angle=Math.atan2(ty-this.y,tx-this.x);  //arctan(y,x)
        this.vx=Math.cos(angle);
        this.vy=Math.sin(angle);
    }

    is_attacked(angle,damage,type){  //受到伤害

        for(let i=0;i<20+Math.random()*10;i++){  //随机向外分裂小球
            let x=this.x,y=this.y;
            let radius=this.radius*Math.random()*0.1;
            let angle=Math.PI*2*Math.random();
            let vx=Math.cos(angle),vy=Math.sin(angle);
            let color=this.color;
            let speed=this.speed*10;
            let move_length=this.radius*Math.random()*5;
            new Particle(this.playground,x,y,radius,vx,vy,color,speed,move_length);
        }

        this.radius-=damage;  //受到伤害半径变小
        if(this.radius<=this.eps){
            this.destory();
            return false;
        }

        this.damage_x=Math.cos(angle);
        this.damage_y=Math.sin(angle);
        this.damage_speed=damage*80;

        if(type==="iceball"){
            this.speed*=0.8;  //减速
        }
        this.speed*=1.25;   //受到伤害后加速
    }

    update(){
        this.update_move();
        this.render();
    }

    update_move(){  //更新移动
        this.spent_time+=this.timedelta/1000;

        if(this.character==="robot" && this.spent_time>4 && Math.random()<1/180.0){  //4秒钟后,人机每3s向玩家发射一枚ball
            let player=this.playground.players[0];  //玩家

            let tx=player.x+player.vx*player.speed*player.timedelta/1000*0.3;  //预判玩家0.3s后的位置
            let ty=player.y+player.vy*player.speed*player.timedelta/1000*0.3;

            if(Math.random()<0.2){  //每发射五个球有一个iceball
                this.shoot_ball(tx,ty,"iceball");
            }else{
                this.shoot_ball(tx,ty,"fireball");
            }
        }

        if(this.damage_speed>0.01){  //受到伤害
            this.vx=this.vy=0;
            this.move_length=0;
            this.x+=this.damage_x*this.damage_speed*this.timedelta/1000;
            this.y+=this.damage_y*this.damage_speed*this.timedelta/1000;
            this.damage_speed*=this.friction;
        }else{
            if(this.move_length<this.eps){  //移动到目标地点
                this.move_length=0;
                this.vx=this.vy=0;
                if(this.character==="robot"){  //随机移动
                    let tx=Math.random()*this.playground.width/this.playground.scale;
                    let ty=Math.random()*this.playground.height/this.playground.scale;
                    this.move_to(tx,ty);
                }
            }else{
                let moved=Math.min(this.move_length,this.speed*this.timedelta/1000);  //每次移动的距离(需要移动距离和可移动距离的较小值)
                this.x+=this.vx*moved;
                this.y+=this.vy*moved;
                this.move_length-=moved;
            }
        }
    }

    render(){
        let scale=this.playground.scale;
        if(this.character!=="robot"){
            this.ctx.save();
            this.ctx.beginPath();
            this.ctx.arc(this.x*scale, this.y*scale, this.radius*scale, 0, Math.PI * 2, false);
            this.ctx.stroke();
            this.ctx.clip();
            this.ctx.drawImage(this.img, (this.x - this.radius)*scale, (this.y - this.radius)*scale, this.radius * 2*scale, this.radius * 2*scale);
            this.ctx.restore();
        }else{
            this.ctx.beginPath();
            this.ctx.arc(this.x*scale,this.y*scale,this.radius*scale,0,Math.PI*2,false);  //画圆
            this.ctx.fillStyle=this.color;
            this.ctx.fill();
        }
    }

    on_destory(){
        for(let i=0;i<this.playground.players.length;i++){
            if(this.playground.players[i]===this){
                this.playground.players.splice(i,1);
            }
        }
    }
}

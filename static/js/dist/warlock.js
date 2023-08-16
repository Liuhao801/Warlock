class GameMenu{
    constructor(root){
        this.root=root;
        this.$menu=$(`
<div class="game-menu">
    <div class="game-menu-field">
        <div class="game-menu-field-item game-menu-field-item-single-mode">
            单人模式
        </div>
        <br>
        <div class="game-menu-field-item game-menu-field-item-multi-mode">
            多人模式
        </div>
        <br>
        <div class="game-menu-field-item game-menu-field-item-settings">
            退出
        </div>
    </div>
</div>
`);
        this.hide();
        this.root.$game.append(this.$menu);
        this.$single_mode=this.$menu.find('.game-menu-field-item-single-mode');
        this.$multi_mode=this.$menu.find('.game-menu-field-item-multi-mode');
        this.$settings=this.$menu.find('.game-menu-field-item-settings');

        this.start();
    }

    start(){
        this.add_listening_events();
    }

    add_listening_events(){
        let outer=this;
        this.$single_mode.click(function(){
            outer.hide();
            outer.root.playground.show("single_mode");
        });
        this.$multi_mode.click(function(){
            outer.hide();
            outer.root.playground.show("multi_mode");
        });
        this.$settings.click(function(){
            outer.root.settings.logout_on_remote();
        });
    }

    show(){  //显示menu界面
        this.$menu.show();
    }

    hide(){  //关闭menu界面
        this.$menu.hide();
    }
}

let GAME_OBJECTS=[];

class GameObject{
    constructor(){
        GAME_OBJECTS.push(this);

        this.has_called_start=false;  //是否调用过start()函数
        this.timedelta=0;  //当前帧距离上一帧的时间间隔(ms)
        this.uuid=this.create_uuid();  //创建唯一编号


    }

    create_uuid(){
        let res="";
        for(let i=0;i<10;i++){
            let x=parseInt(Math.floor(Math.random()*10));  //random返回[0,1)之间的数
            res+=x;
        }
        return res;
    }

    start(){  //创建是执行一次
    }

    update(){  //每一帧执行一次
    }

    on_destroy(){  //被销毁前执行
    }

    destroy(){  //销毁该物体
        this.on_destroy();

        for(let i=0;i<GAME_OBJECTS.length;i++){
            if(GAME_OBJECTS[i]===this){
                GAME_OBJECTS.splice(i,1);
                break;
            }
        }
    }
}

let last_timestamp;  //上一帧时间戳
let GAME_ANIMATION = function(timestamp){
    
    for(let i=0;i<GAME_OBJECTS.length;i++){
        let obj=GAME_OBJECTS[i];
        if(!obj.has_called_start){
            obj.start();
            obj.has_called_start=true;
        }else{
            obj.timedelta=timestamp-last_timestamp;
            obj.update();
        }
    }
    last_timestamp=timestamp;

    requestAnimationFrame(GAME_ANIMATION);
}


requestAnimationFrame(GAME_ANIMATION);
class ChatField{
    constructor(playground){
        this.playground=playground;

        this.$history=$(`<div class="game-chat-field-history">历史记录</div>`);
        this.$input=$(`<input type="text" class="game-chat-field-input">`);

        this.$history.hide();
        this.$input.hide();
        this.is_open=false;
        this.func_id=null;

        this.playground.$playground.append(this.$history);
        this.playground.$playground.append(this.$input);

        this.start();
    }

    start(){
        this.add_listening_events();
    }

    add_listening_events(){
        let outer=this;
        this.$input.keydown(function(e){
            if(e.which===13){  //enter
                if(outer.is_open){
                    let text=outer.$input.val();
                    if(text){  //发送信息
                        outer.$input.val("");  //清空
                        let username=outer.playground.root.settings.username;
                        outer.add_message(username,text);
                        outer.playground.mps.send_message(username,text);
                    }else{
                        outer.hide_input();
                    }
                }else{
                    outer.show_input();
                }
                return false;
            }
        });
    }

    render_message(message){
        return $(`<div>${message}</div>`);
    }

    add_message(username,text){
        this.show_history();
        let message=`[${username}]:${text}`;
        this.$history.append(this.render_message(message));
        this.$history.scrollTop(this.$history[0].scrollHeight);  //将滚动条移到最下方
    }

    show_history(){
        let outer=this;
        this.$history.fadeIn();  //缓慢显示

        if(this.func_id) clearTimeout(this.func_id);

        this.func_id=setTimeout(function(){  //3s后消失
            outer.$history.fadeOut();
            outer.func_id=null;
        },3000);
    }

    show_input(){
        this.show_history();
        this.$input.show();
        this.$input.focus();
        this.is_open=true;
    }

    hide_input(){
        this.$input.hide();
        this.playground.game_map.$canvas.focus();
        this.is_open=false;
    }
}
class GameMap extends GameObject{
    constructor(playground){
        super();  //调用基类构造函数
        this.playground=playground;
        this.$canvas=$(`<canvas tabindex=0></canvas>`);
        this.ctx=this.$canvas[0].getContext('2d');
        this.ctx.canvas.width=this.playground.width;
        this.ctx.canvas.height=this.playground.height;
        this.playground.$playground.append(this.$canvas);
    }

    start(){
        this.$canvas.focus();
    }

    resize(){
        this.ctx.canvas.width=this.playground.width;
        this.ctx.canvas.height=this.playground.height;
        this.ctx.fillStyle="rgba(0,0,0,1)";
        this.ctx.fillRect(0,0,this.ctx.canvas.width,this.ctx.canvas.height);
    }
    update(){
        this.render();
    }

    render(){
        this.ctx.fillStyle="rgba(0,0,0,0.2)";
        this.ctx.fillRect(0,0,this.ctx.canvas.width,this.ctx.canvas.height);
    }

}
class NoticeBoard extends GameObject{
    constructor(playground){
        super();
        this.playground=playground;
        this.ctx=this.playground.game_map.ctx;
        this.text="已就绪:0人";
        this.start();
    }

    start(){
    }

    write(text){
        this.text=text;
    }

    update(){
        this.render();
    }

    render(){
        this.ctx.font = "20px serif";
        this.ctx.fillStyle = "white";
        this.ctx.textAlign = "center";
        this.ctx.fillText(this.text, this.playground.width/2,20);
    }
}
class Particle extends GameObject{
    constructor(playground,x,y,radius,vx,vy,color,speed,move_length){
        super();
        this.playground=playground;
        this.ctx=this.playground.game_map.ctx;
        this.x=x;
        this.y=y;
        this.vx=vx;
        this.vy=vy;
        this.radius=radius;
        this.color=color;
        this.speed=speed;
        this.move_length=move_length;

        this.friction=0.9;
        this.eps=0.01;
    }

    start(){
    }

    update(){
        if( this.move_length<this.eps || this.speed<this.eps){
            this.destroy();
            return false;
        }

        let moved=Math.min(this.move_length,this.speed*this.timedelta/1000);
        this.x+=this.vx*moved;
        this.y+=this.vy*moved;
        this.move_length-=moved;
        this.speed*=this.friction;

        this.render();
    }

    render(){
        let scale=this.playground.scale;
        this.ctx.beginPath();
        this.ctx.arc(this.x*scale,this.y*scale,this.radius*scale,0,Math.PI*2,false);
        this.ctx.fillStyle=this.color;
        this.ctx.fill();
    }
}
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
        this.balls=[];  //玩家发射的子弹

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

        if(this.character==="me"){
            this.fireball_coldtime=2;  //单位:s
            this.fireball_img=new Image();
            this.fireball_img.src="https://cdn.acwing.com/media/article/image/2021/12/02/1_9340c86053-fireball.png";

            this.iceball_coldtime=3;
            this.iceball_img=new Image();
            this.iceball_img.src="https://img1.imgtp.com/2023/08/14/YVipRGUc.jpg";

            this.flash_coldtime=5;
            this.flash_img=new Image();
            this.flash_img.src="https://cdn.acwing.com/media/article/image/2021/12/02/1_daccabdc53-blink.png";
        }
    }

    start(){
        this.playground.player_count++;
        this.playground.notice_board.write("正在匹配旗鼓相当的对手...");

        if(this.playground.player_count>=3){
            this.playground.state="fighting";
            this.playground.notice_board.write("开始对战");
        }

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
            if(outer.playground.state!=='fighting'){
                return true;
            }

            const rect=outer.ctx.canvas.getBoundingClientRect();
            const tx=(e.clientX-rect.left)/outer.playground.scale,ty=(e.clientY-rect.top)/outer.playground.scale;  //转化为画布的相对坐标
            if(e.which===3){  //点击鼠标右键
                outer.move_to(tx,ty);

                if(outer.playground.mode==="multi_mode"){  //广播自己的移动
                    outer.playground.mps.send_move_to(tx,ty);
                }

            }else if(e.which===1){  //点击左键
                if(outer.cur_skill==="fireball"){
                    let ball=outer.shoot_ball(tx,ty,"fireball");
                    if(outer.playground.mode==="multi_mode"){
                        outer.playground.mps.send_shoot_ball(tx,ty,"fireball",ball.uuid);
                    }
                    outer.fireball_coldtime=2;
                }else if(outer.cur_skill==="iceball"){
                    let ball=outer.shoot_ball(tx,ty,"iceball");
                    if(outer.playground.mode==="multi_mode"){
                        outer.playground.mps.send_shoot_ball(tx,ty,"iceball",ball.uuid);
                    }
                    outer.iceball_coldtime=3;
                }else if(outer.cur_skill==="flash"){
                    outer.do_flash(tx,ty);
                    if(outer.playground.mode==="multi_mode"){
                        outer.playground.mps.send_flash(tx,ty);
                    }
                    outer.flash_coldtime=5;
                }

                outer.cur_skill=null;
            }
        });

        this.playground.game_map.$canvas.keydown(function(e){
            if(e.which===13){  //enter
                if(outer.playground.mode==="multi_mode"){  //打开聊天框
                    let chat_field=outer.playground.chat_field;
                    if(chat_field.is_open){
                        chat_field.hide_input();
                    }else{
                        chat_field.show_input();
                    }
                    return false;
                }
            }

            if(outer.playground.state!=='fighting'){
                return true;
            }

            if(e.which===81 && outer.fireball_coldtime===0){  //Q键
                outer.cur_skill="fireball";
                return false;
            }else if(e.which===87 && outer.iceball_coldtime===0){  //W键
                outer.cur_skill="iceball";
                return false;
            }else if(e.which===70 && outer.flash_coldtime===0){  //F键
                outer.cur_skill="flash";
                return false;
            }
        });
    }

    shoot_ball(tx,ty,ball_type){  //发射球
        let x=this.x,y=this.y;
        let angle=Math.atan2(ty-y,tx-x);
        let vx=Math.cos(angle),vy=Math.sin(angle);
        let ball=new Ball(this.playground,this,x,y,vx,vy,ball_type);
        this.balls.push(ball);
        return ball;
    }

    destroy_ball(uuid){  //删除球
        for(let i=0;i<this.balls.length;i++){
            let ball=this.balls[i];
            if(ball.uuid===uuid){
                ball.destroy();
                break;
            }
        }
    }

    do_flash(tx,ty){  //闪现
        let dist=this.get_dist(this.x,this.y,tx,ty);
        dist=Math.min(dist,0.5);
        let angle=Math.atan2(ty-this.y,tx-this.x);  //arctan(y,x)
        this.x+=dist*Math.cos(angle);
        this.y+=dist*Math.sin(angle);

        this.move_length=0;  //闪现玩停下来
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
            this.destroy();
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

    receive_attack(x,y,angle,damage,ball_type,ball_uuid,attacker){
        attacker.destroy_ball(ball_uuid);
        this.x=x;  //减少各个窗口中球的位置误差
        this.y=y;
        this.is_attacked(angle,damage,ball_type);
    }

    update(){
        this.spent_time+=this.timedelta/1000;

        if(this.character==="me"&&this.playground.state==="fighting"){
            this.update_coldtime();
        }

        this.update_move();
        this.render();
    }

    update_coldtime(){  //更新技能冷却时间
        this.fireball_coldtime-=this.timedelta/1000;
        this.fireball_coldtime=Math.max(this.fireball_coldtime,0);
        this.iceball_coldtime-=this.timedelta/1000;
        this.iceball_coldtime=Math.max(this.iceball_coldtime,0);
        this.flash_coldtime-=this.timedelta/1000;
        this.flash_coldtime=Math.max(this.flash_coldtime,0);
    }

    update_move(){  //更新移动
        if(this.character==="robot" && this.spent_time>4 && Math.random()<1/300.0){  //4秒钟后,人机每3s向玩家发射一枚ball
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

        if(this.character==="me" && this.playground.state==="fighting"){
            this.render_skill_coldtime();
        }
    }

    render_skill_coldtime(){
        let scale=this.playground.scale;

        let x=1.5,y=0.9,r=0.04;  //火球
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.arc(x*scale, y*scale, r*scale, 0, Math.PI * 2, false);
        this.ctx.stroke();
        this.ctx.clip();
        this.ctx.drawImage(this.fireball_img, (x - r)*scale, (y - r)*scale, r * 2*scale, r * 2*scale);
        this.ctx.restore();

        if(this.fireball_coldtime>0){
            this.ctx.beginPath();
            this.ctx.moveTo(x*scale,y*scale);
            this.ctx.arc(x*scale,y*scale,r*scale,0-Math.PI/2,Math.PI*2*(1-this.fireball_coldtime/2)-Math.PI/2,true);  //画圆
            this.ctx.lineTo(x*scale,y*scale);
            this.ctx.fillStyle="rgba(0,0,255,0.6)";
            this.ctx.fill();
        }


        x=1.6,y=0.9,r=0.04;  //冰球
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.arc(x*scale, y*scale, r*scale, 0, Math.PI * 2, false);
        this.ctx.stroke();
        this.ctx.clip();
        this.ctx.drawImage(this.iceball_img, (x - r)*scale, (y - r)*scale, r * 2*scale, r * 2*scale);
        this.ctx.restore();

        if(this.iceball_coldtime>0){
            this.ctx.beginPath();
            this.ctx.moveTo(x*scale,y*scale);
            this.ctx.arc(x*scale,y*scale,r*scale,0-Math.PI/2,Math.PI*2*(1-this.iceball_coldtime/3)-Math.PI/2,true);  //画圆
            this.ctx.lineTo(x*scale,y*scale);
            this.ctx.fillStyle="rgba(0,0,255,0.6)";
            this.ctx.fill();
        }

        x=1.7,y=0.9,r=0.04;  //闪现
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.arc(x*scale, y*scale, r*scale, 0, Math.PI * 2, false);
        this.ctx.stroke();
        this.ctx.clip();
        this.ctx.drawImage(this.flash_img, (x - r)*scale, (y - r)*scale, r * 2*scale, r * 2*scale);
        this.ctx.restore();

        if(this.flash_coldtime>0){
            this.ctx.beginPath();
            this.ctx.moveTo(x*scale,y*scale);
            this.ctx.arc(x*scale,y*scale,r*scale,0-Math.PI/2,Math.PI*2*(1-this.flash_coldtime/5)-Math.PI/2,true);  //画圆
            this.ctx.lineTo(x*scale,y*scale);
            this.ctx.fillStyle="rgba(0,0,255,0.6)";
            this.ctx.fill();
        }
    }

    on_destroy(){
        if(this.character==="me"){
            this.playground.state="over";  //游戏结束
        }
        for(let i=0;i<this.playground.players.length;i++){
            if(this.playground.players[i]===this){
                this.playground.players.splice(i,1);
                break;
            }
        }
    }
}
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
class GamePlayground{
    constructor(root){
        this.root=root;
        this.$playground=$(`<div class="game-playground"></div>`);

        this.hide();
        this.root.$game.append(this.$playground);
        this.start();
    }


    get_color(){
        let colors=["red","yellow","blue","green","pink","purple","Gray","Orange","Aqua","Gold"];
        return colors[Math.floor(Math.random()*colors.length)];
    }

    start(){
        let outer=this;
        $(window).resize(function(){  //监听窗口大小
            outer.resize();
        });
    }

    resize(){  //根据窗口大小调整画布大小
        this.width=this.$playground.width();
        this.height=this.$playground.height();
        let unit=Math.min(this.width/16,this.height/9);
        this.width=unit*16;
        this.height=unit*9;
        this.scale=this.height;  //基准

        if(this.game_map)this.game_map.resize();
    }

    show(mode){  //打开playground界面
        let outer=this;
        this.$playground.show();

        this.width=this.$playground.width();
        this.height=this.$playground.height();
        this.game_map=new GameMap(this);
        this.friction=0.7;  //地形的摩擦力
        this.mode=mode;
        this.state="waiting";  //waiting->fighting->over
        this.notice_board=new NoticeBoard(this);  //计分板
        this.player_count=0;

        this.resize();

        this.players=[];
        this.players.push(new Player(this,this.width/2/this.scale,0.5,0.05,"snow",0.2,"me",this.root.settings.username,this.root.settings.photo));

        if(mode==="single_mode"){
            for(let i=0;i<5;i++){
                this.players.push(new Player(this,this.width/2/this.scale,0.5,0.05,this.get_color(),0.2,"robot"));
            }
        }else if(mode==="multi_mode"){
            this.chat_field=new ChatField(this);  //聊天框
            this.mps=new MultiPlayerSocket(this);
            this.mps.uuid=this.players[0].uuid;

            this.mps.ws.onopen=function(){  //成功建立连接后
                outer.mps.send_create_player(outer.root.settings.username,outer.root.settings.photo);
            };
        }

    }

    hide(){  //关闭playground界面
        this.$playground.hide();
    }
}
class Settings{
    constructor(root){
        this.root=root;
        this.platform="WEB";
        if(this.root.AcWingOS)this.platform="ACAPP";
        this.username="";
        this.photo="";

        this.$settings=$(`
<div class="game-settings">
    <div class="game-settings-login">
        <div class="game-settings-title">
            登录
        </div>
        <div class="game-settings-username">
            <div class="game-settings-item">
                <input type="text" placeholder="请输入用户名">
            </div>
        </div>
        <div class="game-settings-password">
            <div class="game-settings-item">
                <input type="password" placeholder="请输入密码">
            </div>
        </div>
        <div class="game-settings-submit">
            <div class="game-settings-item">
                <button>登录</button>
            </div>
        </div>
        <div class="game-settings-error-message">
        </div>
        <div class="game-settings-option">
            注册
        </div>
        <br>
        <div class="game-settings-logo">
            <img width="30" src="https://app5846.acapp.acwing.com.cn/static/image/settings/logo.png">
            <br>
            <div>
                AcWing一键登录
            </div>
        </div>
    </div>

    <div class="game-settings-register">
        <div class="game-settings-title">
            注册
        </div>
        <div class="game-settings-username">
            <div class="game-settings-item">
                <input type="text" placeholder="请输入用户名">
            </div>
        </div>
        <div class="game-settings-password game-settings-password-first">
            <div class="game-settings-item">
                <input type="password" placeholder="请输入密码">
            </div>
        </div>
        <div class="game-settings-password game-settings-password-second">
            <div class="game-settings-item">
                <input type="password" placeholder="请再次输入密码">
            </div>
        </div>
        <div class="game-settings-submit">
            <div class="game-settings-item">
                <button>注册</button>
            </div>
        </div>
        <div class="game-settings-error-message">
        </div>
        <div class="game-settings-option">
            登录
        </div>
    </div>
</div>
`);

        this.$login=this.$settings.find(".game-settings-login");
        this.$login_username=this.$login.find(".game-settings-username input");
        this.$login_password=this.$login.find(".game-settings-password input");
        this.$login_submit=this.$login.find(".game-settings-submit button");
        this.$login_error_message=this.$login.find(".game-settings-error-message");
        this.$login_register=this.$login.find(".game-settings-option");

        this.$login.hide();

        this.$register=this.$settings.find(".game-settings-register");
        this.$register_username=this.$register.find(".game-settings-username input");
        this.$register_password=this.$register.find(".game-settings-password-first input");
        this.$register_password_confirm=this.$register.find(".game-settings-password-second input");
        this.$register_submit=this.$register.find(".game-settings-submit button");
        this.$register_error_message=this.$register.find(".game-settings-error-message");
        this.$register_login=this.$register.find(".game-settings-option");

        this.$register.hide();

        this.$acwing_login=this.$settings.find(".game-settings-logo");

        this.root.$game.append(this.$settings);
        this.start();
    }

    start(){
        if(this.platform==="ACAPP"){
            this.getinfo_acapp();
        }else if(this.platform==="WEB"){
            this.getinfo_web();
            this.add_listening_events();
        }
    }

    add_listening_events(){
        let outer=this;
        this.add_listening_events_login();
        this.add_listening_events_register();

        this.$acwing_login.click(function(){
            outer.web_login();
        });
    }

    add_listening_events_login(){  //监听login界面
        let outer=this;
        this.$login_register.click(function(){
            outer.register();
        });
        this.$login_submit.click(function(){
            outer.login_on_remote();
        });
    }

    add_listening_events_register(){  //监听register界面
        let outer=this;
        this.$register_login.click(function(){
            outer.login();
        });
        this.$register_submit.click(function(){
            outer.register_on_remote();
        });
    }

    login(){  //打开登录界面
        this.$register.hide();
        this.$login.show();
    }

    register(){  //打开注册界面
        this.$login.hide();
        this.$register.show();
    }

    login_on_remote(){  //登录远程服务器
        let outer=this;
        let username=this.$login_username.val();
        let password=this.$login_password.val();
        this.$login_error_message.empty();

        $.ajax({
            url:"https://app5846.acapp.acwing.com.cn/settings/login/",
            type:'GET',
            data:{
                username:username,
                password:password,
            },
            success:function(resp){
                if(resp.result==="success"){
                    location.reload();  //刷新当前页
                }else{
                    outer.$login_error_message.html(resp.result);
                }
            }
        });
    }

    register_on_remote(){  //注册远程服务器
        let outer=this;
        let username=this.$register_username.val();
        let password=this.$register_password.val();
        let password_confirm=this.$register_password_confirm.val();
        this.$register_error_message.empty();

        $.ajax({
            url:"https://app5846.acapp.acwing.com.cn/settings/register/",
            type:'GET',
            data:{
                username:username,
                password:password,
                password_confirm:password_confirm,
            },
            success:function(resp){
                if(resp.result==="success"){
                    location.reload();  //刷新当前页
                }else{
                    outer.$register_error_message.html(resp.result);
                }
            }
        });
    }

    logout_on_remote(){  //登出远程服务器
        if(this.platform==="ACAPP"){
            this.root.AcWingOS.api.window.close();
        }

        if(this.platform==="WEB"){
            $.ajax({
                url:'https://app5846.acapp.acwing.com.cn/settings/logout/',
                type:'GET',
                success:function(resp){
                    if(resp.result==='success'){
                        location.reload();
                    }
                }
            });
        }
    }

    web_login(){  //web端第三方授权登录
        $.ajax({
            url:'https://app5846.acapp.acwing.com.cn/settings/acwing/web/apply_code/',
            type:'GET',
            success:function(resp){
                if(resp.result==='success'){
                    window.location.replace(resp.apply_code_url);
                }
            }
        });
    }

    acapp_login(appid,redirect_uri,scope,state){  //acapp端第三方授权登录
        let outer=this;
        this.root.AcWingOS.api.oauth2.authorize(appid, redirect_uri, scope, state, function(resp){
            if(resp.result==='success'){
                outer.username=resp.username;
                outer.photo=resp.photo;
                outer.hide();
                outer.root.menu.show();
            }else{
                this.root.AcWingOS.api.window.close();
            }
        });
    }

    getinfo_acapp(){
        let outer=this;
        $.ajax({
            url:'https://app5846.acapp.acwing.com.cn/settings/acwing/acapp/apply_code/',
            type:'GET',
            success:function(resp){
                if(resp.result==='success'){
                    outer.acapp_login(resp.appid,resp.redirect_uri,resp.scope,resp.state);
                }else{
                    this.root.AcWingOS.api.window.close();
                }
            }
        });
    }

    getinfo_web(){
        let outer=this;

        $.ajax({
            url:"https://app5846.acapp.acwing.com.cn/settings/getinfo/",
            type:"GET",
            data:{
                platform:outer.platform,
            },
            success:function(resp){
                if(resp.result==="success"){
                    outer.username=resp.username;
                    outer.photo=resp.photo;
                    outer.hide();
                    outer.root.menu.show();
                }else{
                    outer.login();
                }
            }
        });
    }

    hide(){
        this.$settings.hide();
    }

    show(){
        this.$settings.show();
    }
}

export class Game{
    constructor(id,AcWingOS){
        this.id=id;
        this.$game=$('#'+id);
        this.AcWingOS=AcWingOS;

        this.settings=new Settings(this);
        this.menu=new GameMenu(this);
        this.playground=new GamePlayground(this);
    }
}

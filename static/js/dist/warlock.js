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
            outer.root.playground.show();
        });
        this.$multi_mode.click(function(){
            console.log("click multi mode");
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

    }

    start(){  //创建是执行一次
    }

    update(){  //每一帧执行一次
    }

    on_destory(){  //被销毁前执行
    }

    destory(){  //销毁该物体
        this.on_destory();

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
class GameMap extends GameObject{
    constructor(playground){
        super();  //调用基类构造函数
        this.playground=playground;
        this.$canvas=$(`<canvas></canvas>`);
        this.ctx=this.$canvas[0].getContext('2d');
        this.ctx.canvas.width=this.playground.width;
        this.ctx.canvas.height=this.playground.height;
        this.playground.$playground.append(this.$canvas);
    }

    start(){
    }

    update(){
        this.render();
    }
    
    render(){
        this.ctx.fillStyle="rgba(0,0,0,0.2)";
        this.ctx.fillRect(0,0,this.ctx.canvas.width,this.ctx.canvas.height);
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
        this.eps=1;
    }

    start(){
    }

    update(){
        if( this.move_length<this.eps || this.speed<this.eps){
            this.destory();
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
        this.ctx.beginPath();
        this.ctx.arc(this.x,this.y,this.radius,0,Math.PI*2,false);
        this.ctx.fillStyle=this.color;
        this.ctx.fill();
    }
}
class Player extends GameObject{
    constructor(playground,x,y,radius,color,speed,is_me){
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
        this.is_me=is_me;  //判断是否是本人
        this.spent_time=0;  //创建后经过的时间

        this.damage_x=0;
        this.damage_y=0;
        this.damage_speed=0;  //受到伤害后的移动速度
        this.friction=this.playground.friction;  //地形的摩擦力

        this.eps=0.1  //浮点精度

        this.cur_skill=null;  //当前选中的技能(fireball,iceball,lightningball,flash)

        if(this.is_me){
            this.img = new Image();
            this.img.src = this.playground.root.settings.photo;
        }
    }

    start(){
        if(this.is_me){  //只监听自己的鼠标操作
            this.add_listening_events();
        }else{  //随机移动
            let tx=Math.random()*this.playground.width;
            let ty=Math.random()*this.playground.height;
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
            const tx=e.clientX-rect.left,ty=e.clientY-rect.top;  //转化为画布的相对坐标
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
        this.x+=this.vx*this.playground.height*0.2;
        this.y+=this.vy*this.playground.height*0.2;

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
        if(this.radius<this.playground.height*0.02){
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
        this.spent_time+=this.timedelta/1000;

        if(!this.is_me && this.spent_time>4 && Math.random()<1/180.0){  //4秒钟后,人机每3s向玩家发射一枚ball
            let player=this.playground.players[0];  //玩家

            let tx=player.x+player.vx*player.speed*player.timedelta/1000*0.3;  //预判玩家0.3s后的位置
            let ty=player.y+player.vy*player.speed*player.timedelta/1000*0.3;

            if(Math.random()<0.2){  //每发射五个球有一个iceball
                this.shoot_ball(tx,ty,"iceball");
            }else{
                this.shoot_ball(tx,ty,"fireball");
            }
        }

        if(this.damage_speed>this.playground.height*0.01){  //受到伤害
            this.vx=this.vy=0;
            this.move_length=0;
            this.x+=this.damage_x*this.damage_speed*this.timedelta/1000;
            this.y+=this.damage_y*this.damage_speed*this.timedelta/1000;
            this.damage_speed*=this.friction;
        }else{
            if(this.move_length<this.eps){  //移动到目标地点
                this.move_length=0;
                this.vx=this.vy=0;
                if(!this.is_me){  //随机移动
                    let tx=Math.random()*this.playground.width;
                    let ty=Math.random()*this.playground.height;
                    this.move_to(tx,ty);
                }
            }else{
                let moved=Math.min(this.move_length,this.speed*this.timedelta/1000);  //每次移动的距离(需要移动距离和可移动距离的较小值)
                this.x+=this.vx*moved;
                this.y+=this.vy*moved;
                this.move_length-=moved;
            }
        }

        this.render();
    }

    render(){
        if(this.is_me){
            this.ctx.save();
            this.ctx.beginPath();
            this.ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
            this.ctx.stroke();
            this.ctx.clip();
            this.ctx.drawImage(this.img, this.x - this.radius, this.y - this.radius, this.radius * 2, this.radius * 2); 
            this.ctx.restore();
        }else{
            this.ctx.beginPath();
            this.ctx.arc(this.x,this.y,this.radius,0,Math.PI*2,false);  //画圆
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
class GamePlayground{
    constructor(root){
        this.root=root;
        this.$playground=$(`<div class="game-playground"></div>`);

        this.hide();
        this.start();
    }


    get_color(){
        let colors=["red","yellow","blue","green","pink","purple","Gray","Orange","Aqua","Gold"];
        return colors[Math.floor(Math.random()*colors.length)];
    }

    start(){
    }

    show(){  //打开playground界面
        this.$playground.show();

        this.root.$game.append(this.$playground);
        this.width=this.$playground.width();
        this.height=this.$playground.height();
        this.friction=0.7;  //地形的摩擦力

        this.game_map=new GameMap(this);

        this.players=[];
        this.players.push(new Player(this,this.width/2,this.height/2,this.height*0.05,"snow",this.height*0.2,true));

        for(let i=0;i<7;i++){
            this.players.push(new Player(this,this.width/2,this.height/2,this.height*0.05,this.get_color(),this.height*0.2,false));
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
        if(this.platform==="ACAPP")return false;

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

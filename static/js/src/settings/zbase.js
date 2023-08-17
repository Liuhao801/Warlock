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
            if(this.root.access){
                this.getinfo_web();
                this.refresh_jwt_token();
            }else{
                this.login()
            }
            this.add_listening_events();
        }
    }

    refresh_jwt_token(){
        setInterval(()=>{
            $.ajax({
                url:'https://app5846.acapp.acwing.com.cn/settings/token/refresh/',
                type:'post',
                data:{
                    'refresh':this.root.refresh,
                },
                success:resp=>{
                    this.root.access=resp.access;
                }
            });
        },4.5*60*1000);
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

    login_on_remote(username,password){  //登录远程服务器
        username=username || this.$login_username.val();
        password=password || this.$login_password.val();
        this.$login_error_message.empty();

        $.ajax({
            url:"https://app5846.acapp.acwing.com.cn/settings/token/",
            type:'post',
            data:{
                username:username,
                password:password,
            },
            success: resp =>{
                this.root.access=resp.access;
                this.root.refresh=resp.refresh;
                this.refresh_jwt_token();
                this.getinfo_web();
            },
            error:()=>{
                this.$login_error_message.html("用户名或密码错误");
            }
        });
    }

    register_on_remote(){  //注册远程服务器
        let username=this.$register_username.val();
        let password=this.$register_password.val();
        let password_confirm=this.$register_password_confirm.val();
        this.$register_error_message.empty();

        $.ajax({
            url:"https://app5846.acapp.acwing.com.cn/settings/register/",
            type:'post',
            data:{
                username:username,
                password:password,
                password_confirm:password_confirm,
            },
            success:resp =>{
                if(resp.result==="success"){
                    this.login_on_remote(username,password);
                }else{
                    this.$register_error_message.html(resp.result);
                }
            }
        });
    }

    logout_on_remote(){  //登出远程服务器
        if(this.platform==="ACAPP"){
            this.root.AcWingOS.api.window.close();
        }

        if(this.platform==="WEB"){
            this.root.access="";
            this.root.refresh="";
            location.href="/";
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
                outer.root.access=resp.access;
                outer.root.refresh=resp.refresh;
                outer.refresh_jwt_token();
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
            headers:{
                'Authorization':"Bearer "+this.root.access,
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


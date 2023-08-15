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

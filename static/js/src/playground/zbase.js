class GamePlayground{
    constructor(root){
        this.root=root;
        this.$playground=$(`<div class="game-playground"></div>`);

        this.hide();
        this.root.$game.append(this.$playground);
        this.start();
    }


    get_color(){
        let colors=["yellow","blue","green","pink","purple","Gray","Aqua","Gold"];
        return colors[Math.floor(Math.random()*colors.length)];
    }

    create_uuid(){
        let res="";
        for(let i=0;i<8;i++){
            let x=parseInt(Math.floor(Math.random()*10));
            res+=x;
        }
        return res;
    }

    start(){
        let outer=this;
        let uuid=this.create_uuid();
        $(window).on(`resize.${uuid}`,function(){  //监听窗口大小
            outer.resize();
        });

        if(this.root.AcWingOS){
            this.root.AcWingOS.api.window.on_close(function(){
                $(window).off(`resize.${uuid}`);
                outer.hide();
            });
        }
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
        this.score_board=new ScoreBoard(this);  //结果牌
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
        while(this.players && this.players.length>0){
            this.players[0].destroy();
        }

        if(this.game_map){
            this.game_map.destroy();
            this.game_map=null;
        }

        if(this.notice_board){
            this.notice_board.destroy();
            this.notice_board=null;
        }

        if(this.score_board){
            this.score_board.destroy();
            this.score_board=null;
        }

        this.$playground.empty();  //清空所有html元素
        this.$playground.hide();
    }
}

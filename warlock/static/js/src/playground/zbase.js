class GamePlayground{
    constructor(root){
        this.root=root;
        this.$playground=$(`<div class="game-playground"></div>`);

        //this.hide();
        this.root.$game.append(this.$playground);
        this.width=this.$playground.width();
        this.height=this.$playground.height();
        this.friction=0.7;  //地形的摩擦力


        this.game_map=new GameMap(this);

        this.players=[];
        this.players.push(new Player(this,this.width/2,this.height/2,this.height*0.05,"snow",this.height*0.2,true));

        for(let i=0;i<5;i++){
            this.players.push(new Player(this,this.width/2,this.height/2,this.height*0.05,this.get_color(),this.height*0.2,false));
        }

        this.start();
    }


    get_color(){
        let colors=["red","yellow","blue","green","pink","purple","Gray","Orange"];
        return colors[Math.floor(Math.random()*colors.length)];
    }

    start(){
    }

    show(){  //打开playground界面
        this.$playground.show();
    }

    hide(){  //关闭playground界面
        this.$playground.hide();
    }
}

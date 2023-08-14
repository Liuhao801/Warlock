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

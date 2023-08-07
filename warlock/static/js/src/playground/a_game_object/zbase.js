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

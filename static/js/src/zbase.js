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

export class Vector{
    constructor(public x:number = 0, public y :number = 0){}
    add(vector:Vector):Vector{
        this.x+=vector.x;
        this.y+=vector.y;
        return this;
    }
    sub(vector:Vector):Vector{
        this.x-=vector.x;
        this.y-=vector.y;

        return this;
    }
    multiply(scalar:number):Vector{
        this.x*=scalar;
        this.y*=scalar;
        return this;
    }
    zero():Vector{
        this.x = 0;
        this.y = 0;
        return this;
    }
    distance(vector:Vector):number{
        return Math.sqrt((vector.y - this.y)*(vector.y - this.y ) + (vector.x - this.x ) * (vector.x - this.x));
    }
}
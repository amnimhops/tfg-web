const SI_BASE = 1000;
const SI_UNITS = [
    {unit:'Kilo',symbol:'k'},
    {unit:'Mega',symbol:'M'},
    {unit:'Giga',symbol:'G'},
    {unit:'Tera',symbol:'T'},
    {unit:'Peta',symbol:'P'},
    {unit:'Exa',symbol:'E'}   // Esto equivale a 10^18, el máximo que javascript permite está por debajo (2^53 -1)
];

/**
 * Transforma una cantidad arbitraria de recursos
 * a un número de máximo 4 cifras con la unidad
 * apropiada.
 * @param amount 
 */
export function fmtResourceAmount(amount:number){
    
    let siIndex = -1;

    while(amount > SI_BASE){
        amount /= 1000;
        siIndex = siIndex + 1;
    }

    if(siIndex >= 0){
        return amount.toFixed(2)+SI_UNITS[siIndex].symbol;
    }else{
        return amount.toFixed(0);
    }
    
}

(window as any).fmt = fmtResourceAmount;
//手数料の計算
export function calcFee(sellPrice,feeRate){
    return Math.floor(sellPrice * feeRate)
}

//利益の計算
export function calcProfit(sellPrice, buyPrice, fee, ship, packCost){
    return Math.ceil(sellPrice - buyPrice - fee - ship - packCost)
}

//損益分岐点の計算
export function calcBreakEven(buyPrice, ship, feeRate){
    return Math.ceil((buyPrice + ship) / (1 - feeRate))
}
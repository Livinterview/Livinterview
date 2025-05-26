export interface Room {
    id: number
    gu_name : string
    dong_name: string
    room_type: string
    room_title: string
    room_desc: string
    price_type: string
    img_url_list?: string
    lat: number
    lng: number
    floor: string
    area_m2: number
    deposit: number
    monthly: number
    maintenance_fee : number
  }
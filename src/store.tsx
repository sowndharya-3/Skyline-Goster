import React, { createContext, useContext, useEffect, useState } from 'react';
import { products, Product } from './catalog';
import { toast } from 'sonner';
export type Line = { id:string; size:string; qty:number };
export type Address = { name:string; phone:string; email:string; street:string; city:string; state:string; pin:string };
export type Order = { id:string; items:Line[]; total:number; date:string; address:Address; payment:string; status:string };
type Data = { cart:Line[]; wishlist:string[]; user:{name:string;email:string}|null; orders:Order[]; addresses:Address[] };
const empty:Data={cart:[],wishlist:[],user:null,orders:[],addresses:[]};
const KEY='ghoster-prototype-v1';
export function calculate(cart: Line[], coupon='') {
 const subtotal=cart.reduce((n,l)=>n+(products.find(p=>p.id===l.id)?.price||0)*l.qty,0);
 const discount=coupon==='GHOST10'?Math.round(subtotal*.1):0;
 const shipping=subtotal===0||subtotal>=1499?0:79;
 return {subtotal,discount,shipping,total:subtotal-discount+shipping};
}
function useStoreState(){
 const [data,setData]=useState<Data>(empty);const [ready,setReady]=useState(false);
 const [added,setAdded]=useState<{product:Product;size:string}|null>(null);
 const dismissAdded=()=>setAdded(null);
 useEffect(()=>{try{const saved=JSON.parse(localStorage.getItem(KEY)||'null');if(saved&&Array.isArray(saved.cart)&&Array.isArray(saved.orders)&&Array.isArray(saved.wishlist)&&Array.isArray(saved.addresses))setData({...empty,...saved,cart:saved.cart.filter((l:Line)=>products.some(p=>p.id===l.id&&p.sizes.includes(l.size))&&Number.isInteger(l.qty)&&l.qty>0&&l.qty<=10)});}catch{}setReady(true);},[]);
 useEffect(()=>{if(ready)try{localStorage.setItem(KEY,JSON.stringify(data));}catch{toast.error('Your browser could not save this session.');}},[data,ready]);
 const add=(p:Product,size:string,qty=1)=>{
  if(!p.sizes.includes(size)||!Number.isInteger(qty)||qty<1)return false;
  const current=data.cart.find(l=>l.id===p.id&&l.size===size)?.qty||0;
  if(current+qty>10){toast.error('You can add up to 10 of this size.');return false;}
  setData(d=>{const found=d.cart.find(l=>l.id===p.id&&l.size===size);return {...d,cart:found?d.cart.map(l=>l===found?{...l,qty:Math.min(10,l.qty+qty)}:l):[...d.cart,{id:p.id,size,qty}]};});
  setAdded({product:p,size});
  return true;
 };
 const quantity=(id:string,size:string,qty:number)=>setData(d=>({...d,cart:d.cart.map(l=>l.id===id&&l.size===size?{...l,qty:Math.max(1,Math.min(10,qty))}:l)}));
 const remove=(id:string,size:string)=>setData(d=>({...d,cart:d.cart.filter(l=>l.id!==id||l.size!==size)}));
 const toggleWish=(id:string)=>setData(d=>({...d,wishlist:d.wishlist.includes(id)?d.wishlist.filter(x=>x!==id):[...d.wishlist,id]}));
 return {data,setData,ready,add,quantity,remove,toggleWish,added,dismissAdded};
}
const Context=createContext<ReturnType<typeof useStoreState>|null>(null);
export function StoreProvider({children}:{children:React.ReactNode}){const state=useStoreState();return <Context.Provider value={state}>{children}</Context.Provider>;}
export function useStore(){const ctx=useContext(Context);if(!ctx)throw new Error('StoreProvider is required');return ctx;}
export function go(path:string){window.location.hash=path;}
export function useRoute(){const [route,setRoute]=useState('/');useEffect(()=>{const read=()=>{setRoute(window.location.hash.slice(1)||'/');window.scrollTo(0,0);};read();window.addEventListener('hashchange',read);return()=>window.removeEventListener('hashchange',read);},[]);return route;}

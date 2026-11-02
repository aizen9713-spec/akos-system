// @ts-types="npm:@types/web-push@3.6.4"
import webpush from 'npm:web-push@3.6.7';
import {createDispatchHandler} from '../_shared/push-engine.mjs';
Deno.serve(createDispatchHandler({env:(key:string)=>Deno.env.get(key),fetch,send:(subscription:import("npm:@types/web-push@3.6.4").PushSubscription,payload:string,options:import("npm:@types/web-push@3.6.4").RequestOptions)=>webpush.sendNotification(subscription,payload,options)}));

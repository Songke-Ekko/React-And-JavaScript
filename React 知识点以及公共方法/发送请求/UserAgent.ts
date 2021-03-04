/*
* this lib is for recognizing user device
*/
export enum Device {
    ANDROID,
    APPLE,
    PC
  }
  
  const device = (() => {
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera
    if (/android/i.test(userAgent)) {
      return Device.ANDROID
    } else if (/iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream) {
      return Device.APPLE
    } else {
      return Device.PC
    }
  })()
  
  /* user OS is mobile */
  const isMobile = (() => {
    return [Device.ANDROID, Device.APPLE].includes(device)
  })()
  /* using wechat native browser */
  const isWechat = (() => {
    return /MicroMessenger/i.test(window.navigator.userAgent)
  })()
  /* using alipay native browser */
  const isAlipay = (() => {
    return /alipay/i.test(window.navigator.userAgent)
  })()
  /* using qq native browser */
  const isQQ = (() => {
    // https://segmentfault.com/a/1190000016952785?utm_source=tag-newest
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera
  
    if (/android/i.test(userAgent)) {
      return /MQQBrowser/i.test(userAgent) && /QQ/i.test((userAgent).split('MQQBrowser'));
    } else if (/iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream) {
      return / QQ/i.test(userAgent)
    } else {
      return false;
    }
  })()
  /* compatible emoji for windows */
  const isWindows = (() => {
    return /windows/i.test(window.navigator.userAgent);
  })
  
  export default {
    device,
    isMobile,
    isWechat,
    isAlipay,
    isQQ,
    isWindows,
  }
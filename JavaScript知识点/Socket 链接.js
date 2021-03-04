// 1. Socket（套接字）其实就是介于应用层和传输层之间进行双向通信的断点的抽象，每一端就是一个套接字，提供了应用层进程利用网络协议交换数据的机制。
// 前端实现套接字通信需要用到 eternal-client
import Client from 'eternal-client'

// 再用 Client 去调用一些方法
sudo pm2 delete all

npm run build

sudo pm2 start /home/ufwjerryvu/CYBERSOC_NexusJED/src/server/terminal-ws/server.cjs --name "terminal-ws"
sudo pm2 start /home/ufwjerryvu/CYBERSOC_NexusJED/src/server/forum-ws/message.cjs --name "forum-ws"
sudo pm2 start npm --name "nexusjed" -- start

const menu = [
  { id: 1, name: 'Coxinha de Frango', price: 'R$ 6,50', desc: 'Coxinha crocante, recheio suculento' },
  { id: 2, name: 'Pastel de Queijo', price: 'R$ 5,00', desc: 'Pastel frito na hora, queijo derretido' },
  { id: 3, name: 'Açaí 500ml', price: 'R$ 12,00', desc: 'Açaí na tigela, granola e banana' }
]

function renderMenu() {
  const container = document.getElementById('cards')
  container.innerHTML = ''
  menu.forEach(item => {
    const el = document.createElement('article')
    el.className = 'card'
    el.innerHTML = `<h3>${item.name}</h3><p>${item.desc}</p><strong>${item.price}</strong>`
    container.appendChild(el)
  })
}

function addChatMessage(text, who='user'){
  const log = document.getElementById('chatLog')
  const p = document.createElement('div')
  p.className = 'msg '+who
  p.textContent = text
  log.appendChild(p)
  log.scrollTop = log.scrollHeight
}

function setupChat(){
  const form = document.getElementById('chatForm')
  form.addEventListener('submit', e=>{
    e.preventDefault()
    const input = document.getElementById('message')
    const msg = input.value.trim()
    if(!msg) return
    addChatMessage(msg,'user')
    // resposta demo
    setTimeout(()=> addChatMessage('Obrigado! Seu pedido foi recebido. (demo)','bot'),600)
    input.value = ''
  })
}

renderMenu()
setupChat()
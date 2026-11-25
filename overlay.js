/* Панель поверх игры: компактная копия настроек вкладки «Визуалы» */
const call = async (n, ...a) => { const r = await L.call(n, ...a); if (!r.ok) throw new Error(r.error); return r.data; };
const G = [
  ['Мир', 'world', [['sky', 'Цвет неба', 'color'], ['grass', 'Цвет травы', 'color'], ['foliage', 'Цвет листвы', 'color'], ['contrast', 'Контраст', -50, 50]]],
  ['Предмет в руке', 'hand', [['x', 'Сдвиг вправо', -50, 50], ['y', 'Сдвиг вверх', -50, 50], ['z', 'Сдвиг вперёд', -50, 50], ['rx', 'Поворот X', -180, 180], ['ry', 'Поворот Y', -180, 180], ['rz', 'Поворот Z', -180, 180], ['scale', 'Размер', 30, 200],
    ['anim', 'Анимация (нужен мод)', [['none', 'Нет'], ['swing', 'Взмах'], ['spin', 'Вращение'], ['bob', 'Покачивание'], ['custom', 'Своя (кадры в лаунчере)']]]]],
  ['Звук удара', 'sound', [['type', 'Звук', [['vanilla', 'Как в игре'], ['click', 'Щелчок'], ['thud', 'Глухой удар'], ['bell', 'Колокольчик'], ['custom', 'Мой файл'], ['off', 'Без звука']]], ['volume', 'Громкость', 0, 100]]],
  ['Анимация убийства', 'kill', [['effect', 'Эффект', [['none', 'Нет'], ['volcano', 'Вулкан крови'], ['tornado', 'Ураган'], ['beam', 'Большой луч']]], ['power', 'Сила', 10, 100]]],
  ['Шапка', 'hat', [['type', 'Вид', [['none', 'Нет'], ['diamond', 'Алмазный шлем'], ['straw', 'Коническая шапка']]], ['color', 'Цвет', 'color'], ['height', 'Высота над головой', -10, 40], ['opacity', 'Прозрачность', 10, 100], ['size', 'Размер', 50, 150], ['sway', 'Покачивание', 0, 100]]]
];
let VIS = null, timer = null;
const $ = s => document.querySelector(s);
const setOpen = o => { document.body.classList.toggle('open', o); $('#bar').setAttribute('aria-expanded', String(o)); };
function save() { clearTimeout(timer); $('#st').textContent = 'Сохраняю…'; timer = setTimeout(() => call('saveVis', VIS).then(v => { VIS = v; $('#st').textContent = 'Сохранено. В игре нажми F3 + T'; }).catch(e => { $('#st').textContent = e.message; }), 300); }
function build() {
  const body = $('#body'); body.innerHTML = '';
  G.forEach(([title, g, fields], gi) => {
    const d = document.createElement('details'); if (gi === 0) d.open = true;
    d.innerHTML = '<summary>' + title + '</summary>';
    fields.forEach(([k, name, a, b]) => {
      const l = document.createElement('label'); const cur = VIS[g][k];
      if (a === 'color') l.innerHTML = name + '<input type="color" value="' + cur + '">';
      else if (Array.isArray(a)) l.innerHTML = name + '<select>' + a.map(([v, t]) => '<option value="' + v + '"' + (v === cur ? ' selected' : '') + '>' + t + '</option>').join('') + '</select>';
      else l.innerHTML = name + '<b class="val">' + cur + '</b><input type="range" min="' + a + '" max="' + b + '" value="' + cur + '">';
      const inp = l.querySelector('input,select'), val = l.querySelector('.val');
      inp.addEventListener(inp.tagName === 'SELECT' || inp.type === 'color' ? 'change' : 'input', () => { VIS[g][k] = inp.type === 'range' ? +inp.value : inp.value; if (val) val.textContent = inp.value; save(); });
      d.appendChild(l);
    });
    body.appendChild(d);
  });
}
$('#bar').onclick = () => L.overlay('toggle');
$('#close').onclick = () => L.overlay('close');
document.addEventListener('keydown', e => { if (e.key === 'Escape') L.overlay('close'); });
L.on('ovstate', s => { setOpen(!!s.open); if (s.key) $('#key').textContent = s.key; if (s.open) call('getVis').then(v => { VIS = v; build(); }).catch(() => {}); });
call('getVis').then(v => { VIS = v; build(); }).catch(() => {});

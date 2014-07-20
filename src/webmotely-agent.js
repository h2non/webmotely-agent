(function (global) {
  var server = 'ws://localhost:3000'
  var room = 'c3ce9e42-0f7e-11e4-8261-b2227cce2b54'

  var windowEvents = ['error', 'input', 'scroll', 'resize']
  var bodyEvents = [
    'click', 'focus', 'mousemove', 'mouseout', 'mouseover',
    'mouseup', 'mouseleave', 'mouseenter', 'mousedown',
    'keyup', 'dblclick', 'close', 'select', 'submit'
  ]

  function throttle(fn, ms) {
    var time = new Date().getTime()
    return function () {
      if ((new Date().getTime() - time) > ms) {
        time = new Date().getTime()
        return fn.apply(null, arguments)
      }
    }
  }

  function Webmotely() {
    this.con = Primus.connect(server)
    this._connect()
    this._init()
  }

  Webmotely.prototype._connect = function () {
    var primus = this.con
    var cursor = false
    primus.once('open', function () {
      primus.write({ action: 'join', room: room, type: 'client' })
      primus.on('joinroom', function (room, spark) {
        console.log(spark.id + ' joined to room ' + room)
      })
      primus.on('data', function (data) {
        handleData(data)
      })
    })
  }

  Webmotely.prototype.send = function (data) {
    this.con.write({ room: room, data: data })
  }

  Webmotely.prototype.leave = function () {
    this.con.write({ action: 'leave', room: room })
  }

  Webmotely.prototype._init = function () {
    var self = this
    document.onreadystatechange = function () {
      if (document.readyState === 'complete') {
        init(self)
      }
    }
  }

  function resize(data) {
    window.resizeTo(data.width, data.height)
  }

  function handleData(data) {
    switch (data.type) {
      case 'resize':
        resize(data)
        break
    }
  }

  function wrapEvent(webmotely, fn) {
    fn = throttle(fn, 150)
    return function (ev) {
      var data = fn(ev)
      if (data) {
        webmotely.send(data)
      }
    }
  }

  function getBound(ev, type) {
    if (ev.target) {
      if (ev.target.getBoundingClientRect) {
        return ev.target.getBoundingClientRect()[type || 'top']
      }
    }
  }

  function setPosition(data, ev) {
    data.x = ev.x || ev.clientX || getBound(ev, 'left')
    data.y = ev.y || ev.clientY || getBound(ev, 'top')
  }

  function trackEvent(type) {
    return function (ev) {
      var data = {
        type: type,
        time: new Date().getTime(),
        pageX: window.pageXOffset,
        pageY: window.pageYOffset,
        path: location.pathname
      }

      if (ev.type === 'keyup') {
        if (ev.target.tagName === 'INPUT') {
          data.value = ev.target.value
          data.elX = getBound(ev, 'left') || ev.x || ev.client
          data.elY = getBound(ev, 'top') || ev.y || ev.clientY
        }
      } else {
        setPosition(data, ev)
      }

      return data
    }
  }

  function init(webmotely) {
    var body = document.body

    bodyEvents.forEach(function (event) {
      body.addEventListener(event, wrapEvent(webmotely, trackEvent(event)), true)
    })
    windowEvents.forEach(function (event) {
      window.addEventListener(event, function (ev) {
        var data = trackEvent(event)(ev)
        webmotely.send(data)
      }, true)
    })

  }

  var webmotely = global.webmotely = function (options) {
    return new Webmotely(options)
  }

  webmotely.start = function (options) {
    return webmotely(options)
  }

}(window))

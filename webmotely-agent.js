(function (global) {
  var server = 'ws://localhost:3000'
  var room = 'c3ce9e42-0f7e-11e4-8261-b2227cce2b54'

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
    console.log(data.width, data.height)
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
    fn = throttle(fn, 250)
    return function (ev) {
      var data = fn(ev)
      if (data) {
        webmotely.send(data)
      }
    }
  }

  /**
   * Event trackers
   */
  function trackClickEvent(ev) {
    var data = {
      type: 'click',
      time: new Date().getTime(),
      x: ev.x || ev.clientX,
      y: ev.y || ev.clientY,
      path: location.pathname
    }
    if (ev.toElement) {
      data.text = ev.toElement.textContent || ev.toElement.outerText
    }
    return data
  }

  function trackMouseMove(ev) {
    var data = {
      type: 'mouse',
      time: new Date().getTime(),
      x: ev.x || ev.clientX,
      y: ev.y || ev.clientY,
      path: location.pathname
    }
    return data
  }

  function trackScroll(ev) {
    var data = {
      type: 'scroll',
      time: new Date().getTime(),
      x: ev.x || ev.clientX,
      y: ev.y || ev.clientY,
      pageX: window.pageXOffset,
      pageY: window.pageYOffset,
      path: location.pathname
    }
    return data
  }

  function init(webmotely) {
    var body = document.body
    body.onclick = wrapEvent(webmotely, trackClickEvent)
    body.onmousemove = wrapEvent(webmotely, trackMouseMove)
    body.onscroll = wrapEvent(webmotely, trackScroll)
  }

  global.Webmotely = Webmotely

}(window))

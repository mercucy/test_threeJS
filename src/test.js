function init () {
    // 获取浏览器窗口的宽高，后续会用
    var width = window.innerWidth
    var height = window.innerHeight

    // 创建一个场景
    var scene = new THREE.Scene()

    // 创建一个具有透视效果的摄像机
    var camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000)
    // var camera = new THREE.OrthographicCamera(width / - 10, width / 10, height / 10, height / -10, 1, 1000)

    // 设置摄像机位置，并将其朝向场景中心
    camera.position.set(0, 125, 125)
    camera.lookAt(new THREE.Vector3(0,0,0))

    // 创建一个 WebGL 渲染器，Three.js 还提供 <canvas>, <svg>, CSS3D 渲染器。
    var renderer = new THREE.WebGLRenderer({
      antialias: true // 开启抗齿锯
    })

    // 设置渲染器的清除颜色（即背景色）和尺寸
    renderer.setClearColor(0xffffff)
    renderer.setSize(width, height)

    // 将渲染器的输出（此处是 canvas 元素）插入到 body
    document.body.appendChild(renderer.domElement)

    // 添加环境光，提亮整个场景
    var ambientLight = new THREE.AmbientLight(0x777777)
    scene.add(ambientLight)

    // 添加聚光灯（可产生投影的光）
    var spotLight = new THREE.SpotLight(0xffffff)
    spotLight.position.set(-40, 40, 50)
    scene.add(spotLight)

    var cameraY = 45
    function render () {
      // 渲染，即摄像机拍下此刻的场景
      renderer.render(scene, camera)
      
      // 各个网格（mesh）绕自身中心的 y 轴自转
      if (meshs.length > 0) {
        for (var i = 0; i < meshs.length; i++) {
          meshs[i].rotation.y += 0.01
        }
      }

      requestAnimationFrame(render)
    }

    // 创建一个平面 PlaneGeometry(width, height, widthSegments, heightSegments)
    var planeGeometry = new THREE.PlaneGeometry(120, 140, 1, 1)

    // 创建 Lambert 材质：会对场景中的光源作出反应，但表现为暗淡，而不光亮。
    var planeMaterial = new THREE.MeshLambertMaterial({
      color: 0xffffff
    })
    var plane = new THREE.Mesh(planeGeometry, planeMaterial)

    // 以自身中心为旋转轴，绕 x 轴顺时针旋转 45 度
    plane.rotation.x = -0.5 * Math.PI
    plane.position.set(0, -4, 0)

    scene.add(plane)

    var meshs = addGeometries()
    render()
    
    // 初始化摄像机插件（用于拖拽旋转摄像机，产生交互效果）
    var orbitControls = new THREE.OrbitControls(camera)
    orbitControls.autoRotate = true

    function addGeometries () {
      var geoms = []
      var meshs = []
      // 共 22 个形状，除了 EdgesGeometry、ExtrudeGeometry、TextGeometry、WireframeGeometry，下面涵盖 17 个（PlaneGeometry在上面）
      // Box 长方体
      geoms.push(new THREE.BoxGeometry(8, 8, 8))

      // Circle 圆形
      geoms.push(new THREE.CircleGeometry(8, 32))

      // Cone 圆锥体
      geoms.push(new THREE.ConeGeometry( 8, 20, 32 ))

      // Cylinder 圆柱体
      geoms.push(new THREE.CylinderGeometry(5, 5, 20, 32))

      // Dodecahedron 十二面体
      geoms.push(new THREE.DodecahedronGeometry(8))

      // Icosahedron 二十面体
      geoms.push(new THREE.IcosahedronGeometry(8))

      // Lathe 让任意曲线绕 y 轴旋转生成一个形状，如花瓶
      var lathePoints = [];
      for ( var i = 0; i < 10; i ++ ) {
        lathePoints.push( new THREE.Vector2( Math.sin( i * 0.2 ) * 5 + 2.5, ( i - 5 ) * 2 ) );
      }
      geoms.push(new THREE.LatheGeometry( lathePoints ))

      // Octahedron 八面体
      geoms.push(new THREE.OctahedronGeometry(8))

      // Parametric：根据参数生成形状，THREE.ParametricGeometries.klein 是 ParametricGeometries.js 库提供
      geoms.push(new THREE.ParametricGeometry(THREE.ParametricGeometries.klein, 10, 10))

      var verticesOfCube = [
          -1,-1,-1,    1,-1,-1,    1, 1,-1,    -1, 1,-1,
          -1,-1, 1,    1,-1, 1,    1, 1, 1,    -1, 1, 1,
      ]

      var indicesOfFaces = [
          2,1,0,    0,3,2,
          0,4,7,    7,3,0,
          0,1,5,    5,4,0,
          1,2,6,    6,5,1,
          2,3,7,    7,6,2,
          4,5,6,    6,7,4
      ]

      // Polyhedron 多面体
      geoms.push(new THREE.PolyhedronGeometry( verticesOfCube, indicesOfFaces, 8, 1 ))

      // Ring 环形
      geoms.push(new THREE.RingGeometry( 3, 8, 16 ))

      // Shape 二维形状(心形)
      var x = 0, y = 0;
      var heartShape = new THREE.Shape();

      heartShape.moveTo( x + 5, y + 5 );
      heartShape.bezierCurveTo( x + 5, y + 5, x + 4, y, x, y );
      heartShape.bezierCurveTo( x - 6, y, x - 6, y + 7,x - 6, y + 7 );
      heartShape.bezierCurveTo( x - 6, y + 11, x - 3, y + 15.4, x + 5, y + 19 );
      heartShape.bezierCurveTo( x + 12, y + 15.4, x + 16, y + 11, x + 16, y + 7 );
      heartShape.bezierCurveTo( x + 16, y + 7, x + 16, y, x + 10, y );
      heartShape.bezierCurveTo( x + 7, y, x + 5, y + 5, x + 5, y + 5 );

      geoms.push(new THREE.ShapeGeometry( heartShape ))

      // Sphere 球体
      geoms.push(new THREE.SphereGeometry( 8, 24, 24 ))

      // Tetrahedron 四面体
      geoms.push(new THREE.TetrahedronGeometry(8))

      // Torus 圆环体
      geoms.push(new THREE.TorusGeometry( 6, 2, 16, 100 ))

      // TorusKnot 环面纽结体
      geoms.push(new THREE.TorusKnotGeometry( 6, 2, 100, 16 ))

      // Tube 管道
      var points = [];
      for (var i = 0; i < 5; i++) {
          var randomX = -10 + Math.round(Math.random() * 20);
          var randomY = -7 + Math.round(Math.random() * 20);
          var randomZ = -10 + Math.round(Math.random() * 20);

          points.push(new THREE.Vector3(randomX, randomY, randomZ));
      }

      geoms.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 20, 2, 8, false))

      // 为几何体添加材质
      var j = 0
      for (var i = 0; i < geoms.length; i++) {
        var cubeMaterial = new THREE.MeshLambertMaterial({
          wireframe: true,
          color: Math.random() * 0xffffff
        })

        var materials = [
          new THREE.MeshLambertMaterial({
            color: Math.random() * 0xffffff,
            flatShading: THREE.FlatShading,
            side: THREE.DoubleSide
          }),
          new THREE.MeshBasicMaterial({
            color: 0x000000,
            wireframe: true
          })
        ]

        var mesh = THREE.SceneUtils.createMultiMaterialObject(geoms[i], materials)

        meshs.push(mesh)

        mesh.position.x = -36 + ((i % 4) * 24);
        mesh.position.y = 4;
        mesh.position.z = -36 + (j * 24);

        if ((i + 1) % 4 == 0) {
          j++
        }
        scene.add(mesh)
      }
      console.log(meshs.length)

      return meshs
    }
}
init()
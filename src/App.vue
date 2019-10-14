<template>
  <div id="app">
    <h1>某项目点位分布图</h1>
    <input type="file" ref="file" />
    <button @click="getFile">提交</button>
    <div id="pointset" style="width:1600px;height:700px"></div>
  </div>
</template>

<script>
import * as THREE from "three";
import OrbitControls from "three-orbitcontrols";

export default {
  name: "App",
  data() {
    return {
      points: []
    };
  },
  mounted() {},
  methods: {
    //加载点集数据
    getFile() {
      console.log(this.$refs.file.files);
      let reader = new FileReader();
      if (typeof FileReader === undefined) {
        this.$message({
          type: "info",
          message: "您的浏览器不支持文件读取"
        });
        return;
      }
      reader.readAsText(this.$refs.file.files[0], "gb2312");
      var that = this;
      reader.onload = function(e) {
        let fileStr = e.target.result;
        let arrStr = fileStr.split("\r\n");
        console.log(arrStr.length);
        if (arrStr.length > 0) {
          let count = 0;
          arrStr.forEach(line => {
            if (line.length !== 0) {
              if (count % 3 === 0) {
                let vecStr = line.split(",");
                that.points.push({
                  x: parseFloat(vecStr[0]),
                  y: parseFloat(vecStr[1]),
                  z: parseFloat(vecStr[2]),
                  color: parseFloat(vecStr[3])
                });
              }
              count++;
            }
          });
        }
        console.log("开始加载");
        that.showPoint("pointset", that.points);
      };
    },
    get_param_for_THREE(points, radiusFactor) {
      /********************用到函数********************/

      /*
       *
       *                   Y(z)
       *                   |
       *                   |
       *                   |
       *                E  . . . . . . . . . . . . . . . . . . . . . . . . . . . .  H
       *                 . |                                                   . .
       *               .   |                                                 .   .
       *             .     |                                               .     .
       *        F  . . . . . . . . . . . . . . . . . . . . . . . . . . . .  G    .
       *           .       |                                             .       .                                                 .
       *           .       |                                             .       .  D
       *           .    A  .---------------------------------------------.-------.----------> X(y)                                                   .
       *           .     /                                               .     .
       *           .   /                                                 .   .
       *           . /                                                   . .
       *        B  / . . . . . . . . . . . . . . . . . . . . . . . . . . .  C
       *         /
       *       /
       *     /
       *   Z(x)
       *
       *
       *
       */

      /* 0 计算两点之间的长度 */
      function get_length(point_A, point_B) {
        return Math.sqrt(
          Math.pow(point_A.x - point_B.x, 2) +
            Math.pow(point_A.y - point_B.y, 2) +
            Math.pow(point_A.z - point_B.z, 2)
        );
      }

      /* 1 坐标系转换  threeJS坐标系Z轴不朝上 */
      function coord_convert(points) {
        //z->y, y->x, x->z
        for (let i = 0; i < points.length; i++) {
          let _point = {};
          _point.x = points[i].x;
          _point.y = points[i].y;
          _point.z = points[i].z;
          points[i].x = _point.y;
          points[i].y = _point.z;
          points[i].z = _point.x;
        }
      }

      /* 2 获得点集所在空间长方体角点以及半径 */
      function get_corner_and_radius(points) {
        let max_x = points[0].x;
        let max_y = points[0].y;
        let max_z = points[0].z;
        let min_x = points[0].x;
        let min_y = points[0].y;
        let min_z = points[0].z;

        for (var i = 0; i < points.length; i++) {
          max_x = points[i].x > max_x ? points[i].x : max_x;
          min_x = points[i].x < min_x ? points[i].x : min_x;
          max_y = points[i].y > max_y ? points[i].y : max_y;
          min_y = points[i].y < min_y ? points[i].y : min_y;
          max_z = points[i].z > max_z ? points[i].z : max_z;
          min_z = points[i].z < min_z ? points[i].z : min_z;
        }

        //中心点
        var point_O = {
          x: 0.5 * (min_x + max_x),
          y: 0.5 * (min_y + max_y),
          z: 0.5 * (min_z + max_z)
        };

        //原点A
        var point_A = {
          x: min_x,
          y: min_y,
          z: min_z
        };
        //
        var point_B = {
          x: min_x,
          y: min_y,
          z: max_z
        };
        var point_C = {
          x: max_x,
          y: min_y,
          z: max_z
        };
        var point_D = {
          x: max_x,
          y: min_y,
          z: min_z
        };
        var point_E = {
          x: min_x,
          y: max_y,
          z: min_z
        };
        var point_F = {
          x: min_x,
          y: max_y,
          z: max_z
        };
        var point_G = {
          x: max_x,
          y: max_y,
          z: max_z
        };
        var point_H = {
          x: max_x,
          y: max_y,
          z: min_z
        };

        //计算半径，鉴于对称关系，只需要计算一个平面上的四条线，就可以找到半径
        let OA = get_length(point_O, point_A);
        let OB = get_length(point_O, point_B);
        let OC = get_length(point_O, point_C);
        let OD = get_length(point_O, point_D);

        let radius = Math.max(OA, OB, OC, OD);

        return {
          point_O: point_O,
          point_A: point_A,
          point_B: point_B,
          point_C: point_C,
          point_D: point_D,
          point_E: point_E,
          point_F: point_F,
          point_G: point_G,
          point_H: point_H,
          radius: radius
        };
      }

      let result = new Object();

      coord_convert(points);
      result = get_corner_and_radius(points);
      result.camera = {
        x: result.point_O.x + (result.radius * radiusFactor) / 1.73,
        y: result.point_O.y + (result.radius * radiusFactor) / 1.73,
        z: result.point_O.z + (result.radius * radiusFactor) / 1.73
      };
      return result;
    },
    showPoint(element_id, points) {
      /*************** *点集数据准备，参数计算* ***************/
      let radiusFactor = 2; //相机到物件的半径影响因子

      let param_res = this.get_param_for_THREE(points, radiusFactor);

      /*********************************THREEJS******************************************/
      var wind = document.getElementById(element_id);
      let width = wind.clientWidth;
      let height = wind.clientHeight;

      //创建渲染器
      var renderer = new THREE.WebGLRenderer({
        antialias: true
      });
      //设置渲染器背景色与尺寸
      renderer.setClearColor(new THREE.Color(0xeeeeee));
      renderer.setSize(width, height);
      //将渲染器加载到html
      wind.appendChild(renderer.domElement);

      //创建一个场景
      let scene = new THREE.Scene();

      //创建一个具有透视效果的相机
      let camera = new THREE.PerspectiveCamera(
        80,
        width / width,
        0.1,
        (radiusFactor + 1) * param_res.radius
      );

      // 初始化摄像机插件（用于拖拽旋转摄像机，产生交互效果）
      var controls = new OrbitControls(camera, renderer.domElement);
      //设置相机位置
      camera.position.set(
        param_res.camera.x,
        param_res.camera.y,
        param_res.camera.z
      );
      camera.lookAt(param_res.point_O);

      //创建环境光，没有环境光，点颜色出不来
      let ambientLight = new THREE.AmbientLight(0x777777);
      scene.add(ambientLight);

      controls.object.position.set(
        param_res.camera.x,
        param_res.camera.y,
        param_res.camera.z
      );
      controls.target = new THREE.Vector3(
        param_res.point_O.x,
        param_res.point_O.y,
        param_res.point_O.z
      );

      //文字函数
      function add_text(style, text, position) {
        var loader = new THREE.FontLoader();
        loader.load(style.font, function(font) {
          var meshMaterial = new THREE.MeshNormalMaterial({
            flatShading: THREE.FlatShading,
            transparent: true,
            opacity: 0.9
          });

          style.font = font;
          var text_geometry = new THREE.TextGeometry(text, style);

          var mesh = new THREE.Mesh(text_geometry, meshMaterial);
          mesh.position.set(position.x, position.y, position.z);
          scene.add(mesh);
        });
      }

      //画线函数
      function drawline(style, point_start, point_end) {
        var line_geometry = new THREE.Geometry();
        line_geometry.vertices.push(point_start, point_end);

        var line;
        if (style.basic)
          line = new THREE.Line(
            line_geometry,
            new THREE.LineBasicMaterial(style)
          );
        else {
          line = new THREE.LineSegments(
            line_geometry,
            new THREE.LineDashedMaterial(style)
          );
          line.computeLineDistances();
        }

        scene.add(line);
      }

      //添加顶点文字
      var text_style = {
        size: 5, //字号大小，一般为大写字母的高度
        height: 0.5, //文字的厚度
        weight: "normal", //值为'normal'或'bold'，表示是否加粗
        font: "static/helvetiker_regular.typeface.json", //字体，默认是'helvetiker'，需对应引用的字体文件
        style: "normal", //值为'normal'或'italics'，表示是否斜体
        bevelThickness: 1, //倒角厚度
        bevelSize: 1, //倒角宽度
        curveSegments: 30, //弧线分段数，使得文字的曲线更加光滑
        bevelEnabled: false //布尔值，是否使用倒角，意为在边缘处斜切};
      };
      add_text(text_style, "X", param_res.point_B);
      add_text(text_style, "Y", param_res.point_D);
      add_text(text_style, "Z", param_res.point_E);

      //画外框
      var style = {
        color: 0x0000ff,
        linewidth: 1,
        basic: false,
        dashSize: 0.1,
        gapSize: 1
      };
      drawline(style, param_res.point_A, param_res.point_B);
      drawline(style, param_res.point_B, param_res.point_C);
      drawline(style, param_res.point_C, param_res.point_D);
      drawline(style, param_res.point_D, param_res.point_A);
      drawline(style, param_res.point_E, param_res.point_F);
      drawline(style, param_res.point_F, param_res.point_G);
      drawline(style, param_res.point_G, param_res.point_H);
      drawline(style, param_res.point_H, param_res.point_E);
      drawline(style, param_res.point_A, param_res.point_E);
      drawline(style, param_res.point_D, param_res.point_H);
      drawline(style, param_res.point_B, param_res.point_F);
      drawline(style, param_res.point_C, param_res.point_G);

      //原点
      add_text(
        {
          size: 1, //字号大小，一般为大写字母的高度
          height: 0.02, //文字的厚度
          weight: "normal", //值为'normal'或'bold'，表示是否加粗
          font: "static/helvetiker_regular.typeface.json", //字体，默认是'helvetiker'，需对应引用的字体文件
          style: "normal", //值为'normal'或'italics'，表示是否斜体
          bevelThickness: 1, //倒角厚度
          bevelSize: 1, //倒角宽度
          curveSegments: 30, //弧线分段数，使得文字的曲线更加光滑
          bevelEnabled: false //布尔值，是否使用倒角，意为在边缘处斜切};
        },
        "(" +
          param_res.point_A.x.toString() +
          ", " +
          param_res.point_A.y.toString() +
          ", " +
          param_res.point_A.z.toString() +
          ")",
        param_res.point_A
      );
      //x轴
      drawline(
        { color: 0x000000, linewidth: 2, basic: true },
        param_res.point_A,
        param_res.point_B
      );

      //y轴
      drawline(
        { color: 0x00ff00, linewidth: 2, basic: true },
        param_res.point_A,
        param_res.point_D
      );

      //z轴
      drawline(
        { color: 0xff0000, linewidth: 2, basic: true },
        param_res.point_A,
        param_res.point_E
      );

      //坐标格网
      /*var size = Math.max(
        1.2 * (param_res.max_x - param_res.min_x),
        1.2 * (param_res.max_y - param_res.min_y),
        1.2 * (param_res.max_z - param_res.min_z)
      );
      var divisions = 100;

      var gridHelper = new THREE.GridHelper(size, divisions);
      gridHelper.position.x =
        param_res.min_x + (param_res.max_x - param_res.min_x) * 0.5;
      gridHelper.position.y = 0;
      gridHelper.position.z =
        param_res.min_z + (param_res.max_z - param_res.min_z) * 0.5;
      scene.add(gridHelper);*/

      let geometry = new THREE.Geometry();
      //画点
      for (let i = 0; i < points.length; i++) {
        /*
        var sphereGeometry = new THREE.SphereGeometry(0.5, 10, 10);
        var sphereMaterial =
          points[i].point_type === 0
            ? new THREE.MeshLambertMaterial({ color: 0x77ff77 })
            : points[i].point_type === 1
            ? new THREE.MeshLambertMaterial({ color: 0xff3030 })
            : new THREE.MeshLambertMaterial({ color: 0xff3030 });
        var sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
        sphere.position.x = points[i].x;
        sphere.position.y = points[i].y;
        sphere.position.z = points[i].z;
        scene.add(sphere);*/

        let vertex = new THREE.Vector3(points[i].x, points[i].y, points[i].z);
        geometry.vertices.push(vertex);
      }
      console.log("加载点");
      let material = new THREE.PointsMaterial({ size: 0.1, color: 0x0000ff });
      let partcle = new THREE.Points(geometry, material);
      scene.add(partcle);
      console.log("加载完成！");

      function render(param_res) {
        // 渲染，即摄像机拍下此刻的场景
        renderer.render(scene, camera);
        requestAnimationFrame(render);
      }

      render(param_res);
    }
  }
};
</script>

<style>
</style>

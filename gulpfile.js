const gulp = require('gulp');
const fs = require('fs');
const mkdirp = require('mkdirp');
const zip = require('gulp-zip');
const del = require('del');
const install = require('gulp-install');
const runSequence = require('run-sequence');
const awsLambda = require('node-aws-lambda');

// distディレクトリのクリーンアップと作成済みのdist.zipの削除
gulp.task('clean', callback => {
  return del(['./dist', './dist.zip'], callback);
});

// AWS Lambdaファンクション本体(index.js)をdistディレクトリにコピー
gulp.task('js', () => {
  if (!(fs.existsSync('dist/') && fs.statSync('dist/').isDirectory())) {
    mkdirp.sync('dist/');
  }
  return gulp.src('index.js').pipe(gulp.dest('dist/'));
});

// AWS Lambdaファンクションのデプロイメントパッケージ(ZIPファイル)に含めるnode.jsパッケージをdistディレクトリにインストール
// ({production: true} を指定して、開発用のパッケージを除いてインストールを実施)
gulp.task('node-mods', () => {
  return gulp.src('./package.json').pipe(gulp.dest('dist/')).pipe(install({production: true}));
});

// デプロイメントパッケージの作成(distディレクトリをZIP化)
gulp.task('zip', () => {
  return gulp.src(['dist/**/*', '!dist/package.json']).pipe(zip('dist.zip')).pipe(gulp.dest('./'));
});

// AWS Lambdaファンクションの登録(ZIPファイルのアップロード)
// (既にFunctionが登録済みの場合はFunctionの内容を更新)
gulp.task('upload', callback => {
  return awsLambda.deploy('./dist.zip', require("./lambda-config.js"), callback);
});
 
gulp.task('build', callback => {
  return runSequence(
    ['clean'],
    ['js', 'node-mods'],
    ['zip'],
    callback
  );
});

gulp.task('deploy', callback => {
  return runSequence(
    ['build'],
    ['upload'],
    callback
  );
});

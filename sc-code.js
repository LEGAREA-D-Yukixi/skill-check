/* =========================================================
   LEGAREA SkillCheck — 記述問題（写経モード）
   各言語6問。模範解答は解答欄の上に最初から表示されます。
     t      : 問題名
     task   : 修正指示
     code   : 編集欄の初期値（修正前のコード）
     answer : 模範解答（修正後のコード）
     exp    : 解説
   ※ answer は操作ログ・録画には一切記録されません
   ========================================================= */

window.SC_CODE = {

/* ================= Objective-C ================= */
objc: [
  { t: 'nil チェックを追加する',
    task: 'name が nil のときにクラッシュしないよう、nil チェックを追加してください。',
    code: `- (NSString *)greeting:(NSString *)name {
    return [NSString stringWithFormat:@"Hello, %@", name];
}`,
    answer: `- (NSString *)greeting:(NSString *)name {
    if (name == nil) {
        return @"Hello";
    }
    return [NSString stringWithFormat:@"Hello, %@", name];
}`,
    exp: 'stringWithFormat に nil を渡すと "(null)" が埋め込まれます。早期リターンで分岐します。' },

  { t: 'delegate を weak にする',
    task: '循環参照を防ぐため、delegate プロパティの属性を weak に変更してください。',
    code: `@interface LGDownloader : NSObject
@property (nonatomic, strong) id<LGDownloaderDelegate> delegate;
@property (nonatomic, copy) NSString *baseURL;
@end`,
    answer: `@interface LGDownloader : NSObject
@property (nonatomic, weak) id<LGDownloaderDelegate> delegate;
@property (nonatomic, copy) NSString *baseURL;
@end`,
    exp: 'delegate を strong で保持すると親子で参照を奪い合い、どちらも解放されなくなります。' },

  { t: '文字列リテラルを修正する',
    task: 'NSString のリテラルとして正しい書き方に直してください。',
    code: `NSString *company = "LEGAREA";
NSArray *members = @[ "Sato", "Suzuki" ];`,
    answer: `NSString *company = @"LEGAREA";
NSArray *members = @[ @"Sato", @"Suzuki" ];`,
    exp: 'Objective-C の NSString リテラルは @ が必要です。@ が無いと C 言語の char* になります。' },

  { t: '高速列挙に書き換える',
    task: 'インデックスを使ったループを、高速列挙（for-in）に書き換えてください。',
    code: `for (int i = 0; i < members.count; i++) {
    NSString *name = members[i];
    NSLog(@"%@", name);
}`,
    answer: `for (NSString *name in members) {
    NSLog(@"%@", name);
}`,
    exp: '高速列挙は記述が短く、内部的にも効率的です。要素の添字が不要な場合はこちらを使います。' },

  { t: 'メッセージ送信の構文に直す',
    task: 'ドット記法で書かれたメソッド呼び出しを、角括弧のメッセージ送信構文に直してください。',
    code: `NSString *upper = text.uppercaseString();
NSInteger len = text.length();`,
    answer: `NSString *upper = [text uppercaseString];
NSInteger len = [text length];`,
    exp: 'Objective-C のメソッド呼び出しは [レシーバ メッセージ] です。ドット記法はプロパティ用です。' },

  { t: '可変配列に変更する',
    task: '要素を追加できるよう、NSArray を NSMutableArray に変更して addObject で追加してください。',
    code: `NSArray *langs = @[ @"Swift" ];
// add Objective-C here`,
    answer: `NSMutableArray *langs = [NSMutableArray arrayWithObject:@"Swift"];
[langs addObject:@"Objective-C"];`,
    exp: 'NSArray は生成後に変更できません。追加・削除が必要なら NSMutableArray を使います。' },
],

/* ================= Swift ================= */
swift: [
  { t: '定数に変更する',
    task: '再代入していない変数を let に変更してください。',
    code: `var companyName = "LEGAREA"
var memberCount = 120
print("\\(companyName): \\(memberCount)")`,
    answer: `let companyName = "LEGAREA"
let memberCount = 120
print("\\(companyName): \\(memberCount)")`,
    exp: '再代入しない値は let にします。意図が明確になり、コンパイラの最適化も効きます。' },

  { t: '強制アンラップをやめる',
    task: '強制アンラップを使わず、オプショナルバインディングで安全に取り出してください。',
    code: `func show(_ name: String?) {
    print("Name: " + name!)
}`,
    answer: `func show(_ name: String?) {
    if let name = name {
        print("Name: " + name)
    } else {
        print("Name: unknown")
    }
}`,
    exp: '! は nil のときクラッシュします。if let / guard let で分岐するのが基本です。' },

  { t: 'reduce で合計を求める',
    task: 'for ループでの合計計算を reduce に書き換えてください。',
    code: `let scores = [80, 95, 72]
var total = 0
for s in scores {
    total += s
}`,
    answer: `let scores = [80, 95, 72]
let total = scores.reduce(0, +)`,
    exp: 'reduce(初期値, 結合関数) で畳み込めます。var が不要になり let で書けます。' },

  { t: 'guard で早期リターンする',
    task: 'ネストした if を guard による早期リターンに書き換えてください。',
    code: `func register(name: String?) {
    if let name = name {
        if !name.isEmpty {
            print("Registered: \\(name)")
        }
    }
}`,
    answer: `func register(name: String?) {
    guard let name = name, !name.isEmpty else { return }
    print("Registered: \\(name)")
}`,
    exp: 'guard は条件を満たさない場合に抜けるため、本処理のネストが浅くなります。' },

  { t: '計算プロパティを追加する',
    task: 'fullName を返す計算プロパティを struct に追加してください。',
    code: `struct Member {
    let lastName: String
    let firstName: String
}`,
    answer: `struct Member {
    let lastName: String
    let firstName: String

    var fullName: String {
        return lastName + " " + firstName
    }
}`,
    exp: '保存せず都度計算する値は計算プロパティにします。状態の二重管理を避けられます。' },

  { t: 'nil 合体演算子を使う',
    task: 'nil のときの既定値を ?? で与える形に書き換えてください。',
    code: `var displayName: String
if let n = member.nickname {
    displayName = n
} else {
    displayName = "Guest"
}`,
    answer: `let displayName = member.nickname ?? "Guest"`,
    exp: '?? は左辺が nil のとき右辺を返します。1行で書けて var も不要になります。' },
],

/* ================= Android Java ================= */
ajava: [
  { t: 'レイアウトを設定する',
    task: 'onCreate で activity_main レイアウトを画面に設定してください。',
    code: `@Override
protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
}`,
    answer: `@Override
protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    setContentView(R.layout.activity_main);
}`,
    exp: 'setContentView を呼ばないと画面が何も表示されません。super の呼び出し後に書きます。' },

  { t: 'キャストを追加する',
    task: 'findViewById の戻り値を TextView として受け取れるよう修正してください。',
    code: `TextView title = findViewById(R.id.title);
title.setText("SkillCheck");`,
    answer: `TextView title = (TextView) findViewById(R.id.title);
title.setText("SkillCheck");`,
    exp: 'findViewById は View を返すため、古い API レベルでは明示的なキャストが必要です。' },

  { t: '別の画面を開く',
    task: 'Intent を使って ResultActivity を起動してください。',
    code: `button.setOnClickListener(new View.OnClickListener() {
    @Override
    public void onClick(View v) {
        // open the result screen here
    }
});`,
    answer: `button.setOnClickListener(new View.OnClickListener() {
    @Override
    public void onClick(View v) {
        Intent intent = new Intent(MainActivity.this, ResultActivity.class);
        startActivity(intent);
    }
});`,
    exp: 'Intent に遷移元 Context と遷移先クラスを渡し、startActivity で起動します。' },

  { t: 'Toast を表示する',
    task: '保存完了のメッセージを Toast で短く表示してください。',
    code: `private void onSaved() {
    // show a toast here
}`,
    answer: `private void onSaved() {
    Toast.makeText(this, "Saved", Toast.LENGTH_SHORT).show();
}`,
    exp: 'makeText を作っただけでは表示されません。show() の呼び出しが必要です。' },

  { t: 'null チェックを追加する',
    task: 'getStringExtra が null を返す場合に備え、null チェックを追加してください。',
    code: `String name = getIntent().getStringExtra("name");
nameView.setText(name.trim());`,
    answer: `String name = getIntent().getStringExtra("name");
if (name != null) {
    nameView.setText(name.trim());
} else {
    nameView.setText("");
}`,
    exp: 'Extra が未設定なら null が返ります。そのまま呼ぶと NullPointerException になります。' },

  { t: 'ライフサイクルで解放する',
    task: 'onDestroy をオーバーライドして timer を停止してください。',
    code: `public class MainActivity extends AppCompatActivity {
    private Timer timer;
}`,
    answer: `public class MainActivity extends AppCompatActivity {
    private Timer timer;

    @Override
    protected void onDestroy() {
        super.onDestroy();
        if (timer != null) {
            timer.cancel();
            timer = null;
        }
    }
}`,
    exp: '画面破棄時に解放しないとリークします。super.onDestroy() を忘れずに呼びます。' },
],

/* ================= Kotlin ================= */
kotlin: [
  { t: '読み取り専用にする',
    task: '再代入していない変数を val に変更してください。',
    code: `var company = "LEGAREA"
var members = listOf("Sato", "Suzuki")
println("\$company: \${members.size}")`,
    answer: `val company = "LEGAREA"
val members = listOf("Sato", "Suzuki")
println("\$company: \${members.size}")`,
    exp: 'Kotlin では val が基本です。var は再代入が必要なときだけ使います。' },

  { t: 'null 安全呼び出しにする',
    task: '!! を使わず、安全呼び出しと既定値で書き換えてください。',
    code: `fun length(text: String?): Int {
    return text!!.length
}`,
    answer: `fun length(text: String?): Int {
    return text?.length ?: 0
}`,
    exp: '!! は nil 相当のときに例外を投げます。?. と ?: を組み合わせるのが定石です。' },

  { t: 'data class に変換する',
    task: 'equals / toString を自動生成させるため data class に変更してください。',
    code: `class Member(val id: Int, val name: String)`,
    answer: `data class Member(val id: Int, val name: String)`,
    exp: 'data を付けるだけで equals・hashCode・toString・copy が自動生成されます。' },

  { t: 'when 式に書き換える',
    task: 'if の連鎖を when 式に書き換えてください。',
    code: `fun rank(score: Int): String {
    if (score >= 90) return "S"
    else if (score >= 70) return "A"
    else return "B"
}`,
    answer: `fun rank(score: Int): String = when {
    score >= 90 -> "S"
    score >= 70 -> "A"
    else -> "B"
}`,
    exp: 'when は式として値を返せるため、関数本体を = で直接書けます。' },

  { t: '拡張関数を定義する',
    task: 'String に、空なら既定値を返す orDefault 拡張関数を追加してください。',
    code: `// add orDefault to String
val name = "".orDefault("none")`,
    answer: `fun String.orDefault(value: String): String =
    if (this.isEmpty()) value else this

val name = "".orDefault("none")`,
    exp: '既存クラスを継承せずに機能を足せます。this がレシーバを指します。' },

  { t: '名前付き引数で呼び出す',
    task: '引数の意味が分かるよう、名前付き引数を使った呼び出しに直してください。',
    code: `fun createMember(name: String, isAdmin: Boolean, isActive: Boolean) { }

createMember("Sato", true, false)`,
    answer: `fun createMember(name: String, isAdmin: Boolean, isActive: Boolean) { }

createMember(name = "Sato", isAdmin = true, isActive = false)`,
    exp: '真偽値が並ぶ呼び出しは順番を間違えやすいため、名前付き引数で明示します。' },
],

/* ================= Java ================= */
java: [
  { t: '文字列の比較を直す',
    task: '内容を比較するよう、正しい比較方法に修正してください。',
    code: `public boolean isAdmin(String role) {
    return role == "admin";
}`,
    answer: `public boolean isAdmin(String role) {
    return "admin".equals(role);
}`,
    exp: '== は参照の比較です。リテラルを左に置くと role が null でも例外になりません。' },

  { t: 'StringBuilder に書き換える',
    task: 'ループ内の文字列連結を StringBuilder に書き換えてください。',
    code: `String result = "";
for (String name : names) {
    result += name + ",";
}`,
    answer: `StringBuilder sb = new StringBuilder();
for (String name : names) {
    sb.append(name).append(",");
}
String result = sb.toString();`,
    exp: 'String は不変なので、+= のたびに新しいインスタンスが作られます。' },

  { t: '拡張 for 文にする',
    task: 'インデックスを使わない形に書き換えてください。',
    code: `for (int i = 0; i < names.size(); i++) {
    System.out.println(names.get(i));
}`,
    answer: `for (String name : names) {
    System.out.println(name);
}`,
    exp: '添字が不要なら拡張 for 文のほうが安全で読みやすくなります。' },

  { t: '例外を処理する',
    task: '数値変換に失敗した場合は 0 を返すよう、例外処理を追加してください。',
    code: `public int toInt(String text) {
    return Integer.parseInt(text);
}`,
    answer: `public int toInt(String text) {
    try {
        return Integer.parseInt(text);
    } catch (NumberFormatException e) {
        return 0;
    }
}`,
    exp: '数値以外が渡されると NumberFormatException が投げられます。想定内なら捕捉します。' },

  { t: '重複を取り除く',
    task: 'List の重複を取り除いた Set を作ってください。',
    code: `List<String> langs = Arrays.asList("Java", "Kotlin", "Java");
// need a list without duplicates`,
    answer: `List<String> langs = Arrays.asList("Java", "Kotlin", "Java");
Set<String> unique = new HashSet<>(langs);`,
    exp: 'Set は重複を許しません。順序を保ちたい場合は LinkedHashSet を使います。' },

  { t: '定数にする',
    task: '変更されない値をクラス定数として宣言し直してください。',
    code: `public class Config {
    public int maxRetry = 3;
}`,
    answer: `public class Config {
    public static final int MAX_RETRY = 3;
}`,
    exp: '定数は static final にして大文字スネークケースで命名するのが慣習です。' },
],

/* ================= Python ================= */
python: [
  { t: 'インデントを直す',
    task: 'ブロックが正しく認識されるようインデントを修正してください。',
    code: `def greet(name):
if name:
print(f"Hello, {name}")
else:
print("Hello")`,
    answer: `def greet(name):
    if name:
        print(f"Hello, {name}")
    else:
        print("Hello")`,
    exp: 'Python はインデントがブロックそのものです。半角スペース4つが推奨されます。' },

  { t: 'リスト内包表記にする',
    task: 'for ループでの詰め替えをリスト内包表記に書き換えてください。',
    code: `doubled = []
for n in numbers:
    doubled.append(n * 2)`,
    answer: `doubled = [n * 2 for n in numbers]`,
    exp: '1行で意図が伝わり、append の呼び出しも不要になります。' },

  { t: 'with でファイルを開く',
    task: '確実に閉じられるよう、with 文に書き換えてください。',
    code: `f = open("members.csv", encoding="utf-8")
data = f.read()
f.close()`,
    answer: `with open("members.csv", encoding="utf-8") as f:
    data = f.read()`,
    exp: '例外が起きても with を抜けるときに自動で閉じられます。' },

  { t: 'f-string にする',
    task: '文字列の組み立てを f-string に書き換えてください。',
    code: `message = "Name: " + name + " / Score: " + str(score)`,
    answer: `message = f"Name: {name} / Score: {score}"`,
    exp: 'f-string なら str() での変換が不要で、読みやすくなります。' },

  { t: '辞書の既定値を使う',
    task: 'キーが無い場合でも例外にならないよう get を使ってください。',
    code: `name = member["nickname"]`,
    answer: `name = member.get("nickname", "none")`,
    exp: '[] はキーが無いと KeyError になります。get なら第2引数が既定値になります。' },

  { t: 'main ガードを付ける',
    task: 'import 時に実行されないよう main ガードを追加してください。',
    code: `def main():
    print("start")

main()`,
    answer: `def main():
    print("start")

if __name__ == "__main__":
    main()`,
    exp: 'モジュールとして読み込まれたときに勝手に動かないようにする定型です。' },
],

/* ================= PHP ================= */
php: [
  { t: '厳密比較に直す',
    task: '型も含めて比較するよう修正してください。',
    code: `function isZero($value) {
    return $value == 0;
}`,
    answer: `function isZero($value) {
    return $value === 0;
}`,
    exp: '== では "abc" == 0 が true になる場合があります。原則 === を使います。' },

  { t: '文字列連結を直す',
    task: 'PHP の連結演算子に修正してください。',
    code: `$label = "Name: " + $name + " san";`,
    answer: `$label = "Name: " . $name . " san";`,
    exp: 'PHP の + は数値加算です。文字列の連結はドットを使います。' },

  { t: '配列を短縮構文にする',
    task: '配列の記法を現在の標準的な書き方に直してください。',
    code: `$member = array(
    'name' => 'Sato',
    'role' => 'admin'
);`,
    answer: `$member = [
    'name' => 'Sato',
    'role' => 'admin',
];`,
    exp: 'PHP 5.4 以降は [] が使えます。末尾のカンマを残すと差分が見やすくなります。' },

  { t: 'foreach に書き換える',
    task: 'インデックスを使ったループを foreach に書き換えてください。',
    code: `for ($i = 0; $i < count($members); $i++) {
    echo $members[$i]['name'];
}`,
    answer: `foreach ($members as $member) {
    echo $member['name'];
}`,
    exp: 'count を毎回評価せずに済み、添字のずれも起きません。' },

  { t: 'null 合体演算子を使う',
    task: 'isset による分岐を ?? に書き換えてください。',
    code: `if (isset($_POST['name'])) {
    $name = $_POST['name'];
} else {
    $name = '';
}`,
    answer: `$name = $_POST['name'] ?? '';`,
    exp: '?? は左辺が未定義または null のとき右辺を返します。警告も出ません。' },

  { t: '型宣言を追加する',
    task: '引数と戻り値に型宣言を追加してください。',
    code: `function total($prices) {
    return array_sum($prices);
}`,
    answer: `function total(array $prices): int {
    return array_sum($prices);
}`,
    exp: '型を明示すると誤った呼び出しを実行時に検出できます。' },
],

/* ================= TypeScript ================= */
ts: [
  { t: 'any をやめる',
    task: 'any を使わず、適切な型注釈に直してください。',
    code: `function total(items: any): any {
  return items.length;
}`,
    answer: `function total(items: string[]): number {
  return items.length;
}`,
    exp: 'any は型チェックを無効にします。具体的な型を書くことで誤用を検出できます。' },

  { t: 'interface を定義する',
    task: 'Member 型を interface として定義し、引数に指定してください。',
    code: `function show(member: { id: number; name: string }) {
  console.log(member.name);
}`,
    answer: `interface Member {
  id: number;
  name: string;
}

function show(member: Member) {
  console.log(member.name);
}`,
    exp: '同じ形を複数箇所で使う場合は interface に切り出すと再利用できます。' },

  { t: 'ユニオン型にする',
    task: 'status が取り得る値を文字列のユニオン型で限定してください。',
    code: `function setStatus(status: string) {
  console.log(status);
}`,
    answer: `function setStatus(status: "pending" | "approved" | "rejected") {
  console.log(status);
}`,
    exp: '取り得る値を型で縛ると、タイプミスがコンパイル時に見つかります。' },

  { t: '省略可能にする',
    task: 'nickname を省略可能なプロパティに変更してください。',
    code: `interface Member {
  id: number;
  name: string;
  nickname: string;
}`,
    answer: `interface Member {
  id: number;
  name: string;
  nickname?: string;
}`,
    exp: '? を付けると未指定を許容し、参照時は undefined の可能性が型に現れます。' },

  { t: 'ジェネリクスにする',
    task: '引数の型をそのまま返すよう、ジェネリクスで書き換えてください。',
    code: `function first(items: any[]): any {
  return items[0];
}`,
    answer: `function first<T>(items: T[]): T {
  return items[0];
}`,
    exp: '型パラメータ T を使うと、呼び出し側の型がそのまま戻り値に反映されます。' },

  { t: 'readonly を付ける',
    task: '生成後に変更されないプロパティを readonly にしてください。',
    code: `interface Config {
  apiUrl: string;
  timeout: number;
}`,
    answer: `interface Config {
  readonly apiUrl: string;
  readonly timeout: number;
}`,
    exp: 'readonly を付けると再代入がコンパイルエラーになります。' },
],

/* ================= JavaScript ================= */
js: [
  { t: 'var をやめる',
    task: 'var を const または let に書き換えてください。',
    code: `var company = "LEGAREA";
var count = 0;
count = count + 1;`,
    answer: `const company = "LEGAREA";
let count = 0;
count = count + 1;`,
    exp: '再代入しないものは const、するものは let にします。var は関数スコープで事故のもとです。' },

  { t: 'map に書き換える',
    task: 'for ループでの詰め替えを map に書き換えてください。',
    code: `const names = [];
for (let i = 0; i < members.length; i++) {
  names.push(members[i].name);
}`,
    answer: `const names = members.map(function (member) {
  return member.name;
});`,
    exp: 'map は変換結果の新しい配列を返します。元の配列は変更されません。' },

  { t: '厳密等価にする',
    task: '型変換を伴わない比較に直してください。',
    code: `if (score == "100") {
  console.log("perfect");
}`,
    answer: `if (score === 100) {
  console.log("perfect");
}`,
    exp: '== は型を変換して比較します。意図しない一致を避けるため === を使います。' },

  { t: 'アロー関数にする',
    task: '無名関数をアロー関数に書き換えてください。',
    code: `const passed = scores.filter(function (s) {
  return s >= 70;
});`,
    answer: `const passed = scores.filter((s) => s >= 70);`,
    exp: 'アロー関数は this を束縛せず、1式ならそのまま戻り値になります。' },

  { t: 'async / await にする',
    task: 'then の連鎖を async 関数と await に書き換えてください。',
    code: `function load() {
  return fetch("/api/members")
    .then(function (res) { return res.json(); })
    .then(function (data) { return data.items; });
}`,
    answer: `async function load() {
  const res = await fetch("/api/members");
  const data = await res.json();
  return data.items;
}`,
    exp: '上から下に読める形になり、try / catch で例外も扱いやすくなります。' },

  { t: '分割代入にする',
    task: 'オブジェクトからの取り出しを分割代入で書き換えてください。',
    code: `const name = member.name;
const score = member.score;`,
    answer: `const { name, score } = member;`,
    exp: '必要なプロパティをまとめて取り出せます。既定値も指定できます。' },
],

/* ================= HTML ================= */
html: [
  { t: '代替テキストを追加する',
    task: '画像に説明用の alt 属性を追加してください。',
    code: `<img src="/img/logo.png" width="120">`,
    answer: `<img src="/img/logo.png" width="120" alt="LEGAREA logo">`,
    exp: '読み上げや画像が表示できない場合に使われます。アクセシビリティ上必須です。' },

  { t: 'セマンティック要素にする',
    task: 'div をページ構造に合った要素に置き換えてください。',
    code: `<div class="header">
  <h1>SkillCheck</h1>
</div>
<div class="main">
  <p>Start the exam.</p>
</div>`,
    answer: `<header>
  <h1>SkillCheck</h1>
</header>
<main>
  <p>Start the exam.</p>
</main>`,
    exp: '意味を持つ要素を使うと、読み上げや検索エンジンが構造を理解できます。' },

  { t: 'ラベルを紐付ける',
    task: 'ラベルをタップしても入力欄が選択されるよう紐付けてください。',
    code: `<label>Name</label>
<input type="text" class="name">`,
    answer: `<label for="name">Name</label>
<input type="text" id="name" class="name">`,
    exp: 'label の for と input の id を一致させます。タップ領域が広がり操作しやすくなります。' },

  { t: '文字コードを指定する',
    task: 'head に文字エンコーディングの指定を追加してください。',
    code: `<head>
  <title>SkillCheck</title>
</head>`,
    answer: `<head>
  <meta charset="UTF-8">
  <title>SkillCheck</title>
</head>`,
    exp: 'charset は head の先頭付近に書きます。指定が無いと日本語が文字化けします。' },

  { t: 'リストに書き換える',
    task: '箇条書きを ul と li で書き直してください。',
    code: `<p>- Swift</p>
<p>- Kotlin</p>
<p>- TypeScript</p>`,
    answer: `<ul>
  <li>Swift</li>
  <li>Kotlin</li>
  <li>TypeScript</li>
</ul>`,
    exp: '見た目だけでなく「一覧である」という意味を持たせます。' },

  { t: 'フォームの送信先を指定する',
    task: 'form に送信先と送信方法を指定してください。',
    code: `<form>
  <input type="text" name="name">
  <button type="submit">Submit</button>
</form>`,
    answer: `<form action="/submit" method="post">
  <input type="text" name="name">
  <button type="submit">Submit</button>
</form>`,
    exp: 'action が送信先、method が送信方法です。未指定だと同じURLへ GET されます。' },
],
};

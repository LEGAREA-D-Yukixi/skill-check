/* SkillCheck 記述式（写経）問題
   対象は実務経験3〜5年。実務で出てくる修正を、模範解答どおりに書き写す。
   解答欄に入力する内容はすべて半角英数のみ。 */
(function (root) {
  'use strict';

  const CODE = {

    /* ================= Objective-C ================= */
    objc: [
      { t: '循環参照を断つ',
        task: 'ブロック内の self による循環参照を、weak と strong の組で解消してください。',
        code: `- (void)loadMembers {
    [self.api fetchMembersWithCompletion:^(NSArray *members, NSError *error) {
        if (error) {
            [self showError:error];
            return;
        }
        self.members = members;
        [self.tableView reloadData];
    }];
}`,
        answer: `- (void)loadMembers {
    __weak typeof(self) weakSelf = self;
    [self.api fetchMembersWithCompletion:^(NSArray *members, NSError *error) {
        __strong typeof(weakSelf) strongSelf = weakSelf;
        if (!strongSelf) {
            return;
        }
        if (error) {
            [strongSelf showError:error];
            return;
        }
        strongSelf.members = members;
        [strongSelf.tableView reloadData];
    }];
}`,
        exp: 'weak で参照を弱め、ブロック内では strong に受け直して処理中の解放を防ぎます。nil チェックを忘れると何も起きません。' },

      { t: 'プロパティの属性を直す',
        task: '外部から変更されない文字列、循環参照を避けるデリゲート、不変なコレクションになるよう属性を直してください。',
        code: `@interface LGMemberCell : UITableViewCell
@property (nonatomic, strong) NSString *displayName;
@property (nonatomic, strong) id<LGMemberCellDelegate> delegate;
@property (nonatomic, strong) NSMutableArray *tags;
@property (nonatomic, assign) NSInteger score;
@end`,
        answer: `@interface LGMemberCell : UITableViewCell
@property (nonatomic, copy) NSString *displayName;
@property (nonatomic, weak) id<LGMemberCellDelegate> delegate;
@property (nonatomic, copy) NSArray<NSString *> *tags;
@property (nonatomic, assign, readonly) NSInteger score;
@end`,
        exp: '文字列とコレクションは copy で不変にします。デリゲートは weak、外から変えない値は readonly にします。' },

      { t: '一度だけの初期化にする',
        task: '複数スレッドから呼ばれても1つしか生成されないよう dispatch_once を使ってください。',
        code: `+ (instancetype)sharedClient {
    static LGApiClient *client = nil;
    if (client == nil) {
        client = [[LGApiClient alloc] init];
        client.timeout = 30;
    }
    return client;
}`,
        answer: `+ (instancetype)sharedClient {
    static LGApiClient *client = nil;
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        client = [[LGApiClient alloc] init];
        client.timeout = 30;
    });
    return client;
}`,
        exp: 'nil チェックだけでは同時に通過して二重生成が起きます。dispatch_once は競合しても1回に限定します。' },

      { t: 'エラーを呼び出し側へ返す',
        task: '戻り値で成否を返し、失敗時だけ NSError を詰める形に直してください。',
        code: `- (NSDictionary *)parseResponse:(NSData *)data {
    NSDictionary *json = [NSJSONSerialization JSONObjectWithData:data
                                                         options:0
                                                           error:nil];
    return json;
}`,
        answer: `- (NSDictionary *)parseResponse:(NSData *)data error:(NSError **)error {
    if (data.length == 0) {
        if (error) {
            *error = [NSError errorWithDomain:LGErrorDomain
                                         code:LGErrorEmptyBody
                                     userInfo:nil];
        }
        return nil;
    }
    NSError *jsonError = nil;
    NSDictionary *json = [NSJSONSerialization JSONObjectWithData:data
                                                         options:0
                                                           error:&jsonError];
    if (json == nil && error) {
        *error = jsonError;
    }
    return json;
}`,
        exp: 'error を nil で握りつぶすと原因が追えません。error ポインタ自体が nil の場合も考慮します。' },

      { t: 'UI 更新をメインスレッドへ戻す',
        task: 'バックグラウンドで取得し、UI の更新だけをメインスレッドで行うよう直してください。',
        code: `- (void)refresh {
    NSData *data = [NSData dataWithContentsOfURL:self.feedURL];
    self.items = [self parseResponse:data error:nil];
    [self.tableView reloadData];
    self.statusLabel.text = @"updated";
}`,
        answer: `- (void)refresh {
    dispatch_async(dispatch_get_global_queue(QOS_CLASS_USER_INITIATED, 0), ^{
        NSData *data = [NSData dataWithContentsOfURL:self.feedURL];
        NSError *error = nil;
        NSDictionary *parsed = [self parseResponse:data error:&error];
        dispatch_async(dispatch_get_main_queue(), ^{
            if (error) {
                [self showError:error];
                return;
            }
            self.items = parsed;
            [self.tableView reloadData];
            self.statusLabel.text = @"updated";
        });
    });
}`,
        exp: '同期的な通信はメインスレッドを止めます。UI の更新は必ずメインキューに戻してから行います。' },

      { t: '配列の走査を安全にする',
        task: '要素の型を明示し、nil を除いて、見つかった時点で走査を打ち切る形に直してください。',
        code: `- (LGMember *)findMemberById:(NSString *)memberId {
    LGMember *found = nil;
    for (int i = 0; i < [self.members count]; i++) {
        LGMember *m = [self.members objectAtIndex:i];
        if ([m.memberId isEqualToString:memberId]) {
            found = m;
        }
    }
    return found;
}`,
        answer: `- (nullable LGMember *)findMemberById:(NSString *)memberId {
    if (memberId.length == 0) {
        return nil;
    }
    for (LGMember *member in self.members) {
        if (member.memberId == nil) {
            continue;
        }
        if ([member.memberId isEqualToString:memberId]) {
            return member;
        }
    }
    return nil;
}`,
        exp: '高速列挙にすると添字の扱いが不要になります。見つかった時点で返すと無駄な走査が減ります。' },
    ],

    /* ================= Swift ================= */
    swift: [
      { t: 'エラー処理を throws にする',
        task: '戻り値を省略可能にする代わりに、失敗理由を型で表して throws で返すよう直してください。',
        code: `func loadMember(from data: Data) -> Member? {
    guard let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else {
        return nil
    }
    guard let id = json["id"] as? String else {
        return nil
    }
    return Member(id: id, name: json["name"] as? String ?? "")
}`,
        answer: `enum LoadError: Error {
    case invalidJSON
    case missingField(String)
}

func loadMember(from data: Data) throws -> Member {
    guard let json = try JSONSerialization.jsonObject(with: data) as? [String: Any] else {
        throw LoadError.invalidJSON
    }
    guard let id = json["id"] as? String else {
        throw LoadError.missingField("id")
    }
    guard let name = json["name"] as? String else {
        throw LoadError.missingField("name")
    }
    return Member(id: id, name: name)
}`,
        exp: 'nil を返すだけでは何が足りなかったか分かりません。失敗理由を列挙型で持たせると呼び出し側で分岐できます。' },

      { t: '循環参照を避ける',
        task: 'クロージャが self を強く掴まないようにし、解放済みなら何もしないよう直してください。',
        code: `final class MemberListViewModel {
    private let api: ApiClient
    var onUpdate: (() -> Void)?
    private(set) var members: [Member] = []

    func reload() {
        api.fetchMembers { result in
            if case .success(let list) = result {
                self.members = list
                self.onUpdate?()
            }
        }
    }
}`,
        answer: `final class MemberListViewModel {
    private let api: ApiClient
    var onUpdate: (() -> Void)?
    private(set) var members: [Member] = []

    func reload() {
        api.fetchMembers { [weak self] result in
            guard let self else { return }
            switch result {
            case .success(let list):
                self.members = list
                self.onUpdate?()
            case .failure(let error):
                print("reload failed: \\(error)")
            }
        }
    }
}`,
        exp: '[weak self] と guard let self の組が定石です。失敗側を書かないと握りつぶしになります。' },

      { t: '値型に直す',
        task: '同一性が不要なモデルを値型にし、不変にしたうえで更新用のメソッドを用意してください。',
        code: `class Member {
    var id: String
    var name: String
    var score: Int

    init(id: String, name: String, score: Int) {
        self.id = id
        self.name = name
        self.score = score
    }
}`,
        answer: `struct Member: Equatable {
    let id: String
    let name: String
    let score: Int

    func addingScore(_ delta: Int) -> Member {
        Member(id: id, name: name, score: score + delta)
    }
}

extension Member {
    var isPassed: Bool {
        score >= 70
    }
}`,
        exp: '値型と let で意図しない共有と変更を防げます。更新は新しい値を返す形にします。' },

      { t: '非同期処理を async に直す',
        task: '入れ子のクロージャを async/await で書き直してください。',
        code: `func loadProfile(id: String, completion: @escaping (Profile?) -> Void) {
    api.fetchMember(id: id) { member in
        guard let member = member else {
            completion(nil)
            return
        }
        self.api.fetchScores(id: member.id) { scores in
            completion(Profile(member: member, scores: scores ?? []))
        }
    }
}`,
        answer: `func loadProfile(id: String) async throws -> Profile {
    let member = try await api.fetchMember(id: id)
    let scores = try await api.fetchScores(id: member.id)
    return Profile(member: member, scores: scores)
}

func loadProfiles(ids: [String]) async throws -> [Profile] {
    try await withThrowingTaskGroup(of: Profile.self) { group in
        for id in ids {
            group.addTask { try await self.loadProfile(id: id) }
        }
        return try await group.reduce(into: []) { $0.append($1) }
    }
}`,
        exp: '入れ子が消えて失敗の扱いも一本化されます。独立した処理はタスクグループで並行に走らせます。' },

      { t: '共有状態を actor にする',
        task: '複数の処理から同時に更新されても壊れないよう actor に直してください。',
        code: `final class ScoreCache {
    private var storage: [String: Int] = [:]

    func set(_ score: Int, for id: String) {
        storage[id] = score
    }

    func score(for id: String) -> Int? {
        storage[id]
    }
}`,
        answer: `actor ScoreCache {
    private var storage: [String: Int] = [:]

    func set(_ score: Int, for id: String) {
        storage[id] = score
    }

    func score(for id: String) -> Int? {
        storage[id]
    }

    func merge(_ other: [String: Int]) {
        storage.merge(other) { _, new in new }
    }
}`,
        exp: 'actor の内部状態へのアクセスは直列化されます。呼び出し側は await を付けます。' },

      { t: '絞り込みを型で表す',
        task: '文字列で状態を持つのをやめ、列挙型と網羅的な分岐に直してください。',
        code: `func label(for status: String) -> String {
    if status == "draft" {
        return "draft"
    } else if status == "review" {
        return "in review"
    } else if status == "done" {
        return "done"
    }
    return "unknown"
}`,
        answer: `enum ExamStatus: String, CaseIterable {
    case draft
    case review
    case done

    var label: String {
        switch self {
        case .draft:  return "draft"
        case .review: return "review"
        case .done:   return "done"
        }
    }
}

func label(for status: ExamStatus) -> String {
    status.label
}`,
        exp: '列挙型にすると値の取り違えが起きず、分岐の漏れもコンパイラが指摘します。' },
    ],

    /* ================= Android Java ================= */
    ajava: [
      { t: 'リークする内部クラスを直す',
        task: '非 static の内部クラスが Activity を掴まないよう、static と WeakReference に直してください。',
        code: `public class MemberActivity extends AppCompatActivity {
    private class LoadTask extends AsyncTask<Void, Void, List<Member>> {
        protected List<Member> doInBackground(Void... params) {
            return Repository.loadAll();
        }
        protected void onPostExecute(List<Member> members) {
            adapter.submitList(members);
        }
    }
}`,
        answer: `public class MemberActivity extends AppCompatActivity {
    private static class LoadTask extends AsyncTask<Void, Void, List<Member>> {
        private final WeakReference<MemberActivity> ref;

        LoadTask(MemberActivity activity) {
            this.ref = new WeakReference<>(activity);
        }

        protected List<Member> doInBackground(Void... params) {
            return Repository.loadAll();
        }

        protected void onPostExecute(List<Member> members) {
            MemberActivity activity = ref.get();
            if (activity == null || activity.isFinishing()) {
                return;
            }
            activity.adapter.submitList(members);
        }
    }
}`,
        exp: '非 static の内部クラスは外側を暗黙に強参照します。処理が残ると Activity が解放されません。' },

      { t: '状態を ViewModel へ移す',
        task: '画面回転で消えないよう、取得した一覧を ViewModel と LiveData に移してください。',
        code: `public class MemberActivity extends AppCompatActivity {
    private List<Member> members = new ArrayList<>();

    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_member);
        members = Repository.loadAll();
        adapter.submitList(members);
    }
}`,
        answer: `public class MemberViewModel extends ViewModel {
    private final MutableLiveData<List<Member>> members = new MutableLiveData<>();

    public LiveData<List<Member>> getMembers() {
        return members;
    }

    public void load() {
        if (members.getValue() != null) {
            return;
        }
        Executors.newSingleThreadExecutor().execute(() ->
                members.postValue(Repository.loadAll()));
    }
}`,
        exp: 'ViewModel は構成変更をまたいで生存します。読み込み済みなら再取得しない判定も入れます。' },

      { t: 'メインスレッドを止めない',
        task: '通信をバックグラウンドで行い、結果の反映だけメインスレッドで行うよう直してください。',
        code: `private void save(Member member) {
    boolean ok = Repository.save(member);
    if (ok) {
        Toast.makeText(this, "saved", Toast.LENGTH_SHORT).show();
    } else {
        Toast.makeText(this, "failed", Toast.LENGTH_SHORT).show();
    }
}`,
        answer: `private final ExecutorService io = Executors.newSingleThreadExecutor();
private final Handler main = new Handler(Looper.getMainLooper());

private void save(Member member) {
    io.execute(() -> {
        final boolean ok = Repository.save(member);
        main.post(() -> {
            if (isFinishing()) {
                return;
            }
            String message = ok ? "saved" : "failed";
            Toast.makeText(MemberActivity.this, message, Toast.LENGTH_SHORT).show();
        });
    });
}`,
        exp: 'ディスクや通信をメインスレッドで行うと ANR になります。戻ってきたときに画面が生きているかも確認します。' },

      { t: '解放漏れを塞ぐ',
        task: '登録したリスナとタイマーを破棄時に解除してください。',
        code: `protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    LocationManager manager = getSystemService(LocationManager.class);
    manager.requestLocationUpdates("gps", 1000L, 0f, listener);
    timer = new Timer();
    timer.schedule(task, 0L, 5000L);
}`,
        answer: `private LocationManager manager;

protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    manager = getSystemService(LocationManager.class);
}

protected void onStart() {
    super.onStart();
    manager.requestLocationUpdates("gps", 1000L, 0f, listener);
    timer = new Timer();
    timer.schedule(task, 0L, 5000L);
}

protected void onStop() {
    manager.removeUpdates(listener);
    if (timer != null) {
        timer.cancel();
        timer = null;
    }
    super.onStop();
}`,
        exp: '登録と解除を対になるライフサイクルで書きます。画面が見えない間は止めると電池も節約できます。' },

      { t: 'null 安全にする',
        task: '引数と戻り値の null 可能性を明示し、早期に弾く形に直してください。',
        code: `public String displayName(Member member) {
    return member.getNickname().trim();
}`,
        answer: `@NonNull
public String displayName(@Nullable Member member) {
    if (member == null) {
        return "";
    }
    String nickname = member.getNickname();
    if (nickname == null || nickname.trim().isEmpty()) {
        return member.getId();
    }
    return nickname.trim();
}`,
        exp: '注釈で意図を示し、null と空文字の両方を同じ場所で処理します。呼び出し側の分岐が減ります。' },

      { t: 'リストの差分更新にする',
        task: 'DiffUtil を使い、全体ではなく変わった行だけ更新するよう直してください。',
        code: `public void submitList(List<Member> members) {
    this.items = members;
    notifyDataSetChanged();
}`,
        answer: `private static final DiffUtil.ItemCallback<Member> DIFF =
        new DiffUtil.ItemCallback<Member>() {
            public boolean areItemsTheSame(Member a, Member b) {
                return a.getId().equals(b.getId());
            }

            public boolean areContentsTheSame(Member a, Member b) {
                return a.equals(b);
            }
        };

public void submitList(List<Member> members) {
    differ.submitList(new ArrayList<>(members));
}`,
        exp: '全体更新はちらつきと処理の無駄を生みます。同一判定と内容判定を分けて書きます。' },
    ],

    /* ================= Kotlin ================= */
    kotlin: [
      { t: '結果を型で表す',
        task: '例外と null で返すのをやめ、sealed interface で成功と失敗を表してください。',
        code: `suspend fun loadMembers(): List<Member>? {
    return try {
        api.fetchMembers()
    } catch (e: Exception) {
        null
    }
}`,
        answer: `sealed interface LoadResult<out T> {
    data class Success<T>(val value: T) : LoadResult<T>
    data class Failure(val cause: Throwable) : LoadResult<Nothing>
}

suspend fun loadMembers(): LoadResult<List<Member>> =
    runCatching { api.fetchMembers() }
        .fold(
            onSuccess = { LoadResult.Success(it) },
            onFailure = { LoadResult.Failure(it) },
        )`,
        exp: 'null では理由が消えます。sealed にすると when の分岐漏れをコンパイラが指摘します。' },

      { t: '並行して取得する',
        task: '直列に待っている2つの取得を、async で並行に実行するよう直してください。',
        code: `suspend fun loadProfile(id: String): Profile {
    val member = api.fetchMember(id)
    val scores = api.fetchScores(id)
    return Profile(member, scores)
}`,
        answer: `suspend fun loadProfile(id: String): Profile = coroutineScope {
    val member = async { api.fetchMember(id) }
    val scores = async { api.fetchScores(id) }
    Profile(member.await(), scores.await())
}

suspend fun loadProfiles(ids: List<String>): List<Profile> = coroutineScope {
    ids.map { id -> async { loadProfile(id) } }.awaitAll()
}`,
        exp: '依存しない取得は並行にできます。coroutineScope なら片方の失敗で全体が取り消されます。' },

      { t: 'スレッドを明示する',
        task: '重い処理を IO に逃がし、呼び出し側がどのスレッドでも使えるよう直してください。',
        code: `suspend fun exportCsv(members: List<Member>): String {
    val builder = StringBuilder()
    members.forEach { builder.append(it.id).append(",").append(it.name).append("\\n") }
    File("/tmp/members.csv").writeText(builder.toString())
    return builder.toString()
}`,
        answer: `suspend fun exportCsv(members: List<Member>): String =
    withContext(Dispatchers.IO) {
        val csv = buildString {
            append("id,name\\n")
            members.forEach { member ->
                append(member.id).append(",").append(member.name).append("\\n")
            }
        }
        File("/tmp/members.csv").writeText(csv)
        csv
    }`,
        exp: 'suspend 関数は自分で適切な dispatcher を選びます。呼び出し側がスレッドを気にせず使えます。' },

      { t: '拡張関数にまとめる',
        task: '繰り返し書かれている整形処理を拡張関数とスコープ関数に整理してください。',
        code: `fun summary(member: Member): String {
    var name = member.nickname
    if (name == null || name.isBlank()) {
        name = member.id
    }
    var score = member.score
    if (score < 0) {
        score = 0
    }
    return name + " (" + score + ")"
}`,
        answer: `private fun String?.orFallback(fallback: String): String =
    this?.takeIf { it.isNotBlank() } ?: fallback

private fun Int.atLeastZero(): Int = coerceAtLeast(0)

fun summary(member: Member): String =
    member.run { nickname.orFallback(id) + " (" + score.atLeastZero() + ")" }`,
        exp: '条件分岐を名前の付いた拡張関数に切り出すと意図が読み取れます。run でレシーバを省けます。' },

      { t: '状態を1つの型にまとめる',
        task: '複数のフラグで状態を表すのをやめ、sealed class と StateFlow に直してください。',
        code: `class MemberViewModel : ViewModel() {
    var isLoading = false
    var error: String? = null
    var members: List<Member> = emptyList()
}`,
        answer: `sealed class UiState {
    object Loading : UiState()
    data class Ready(val members: List<Member>) : UiState()
    data class Error(val message: String) : UiState()
}

class MemberViewModel(private val api: ApiClient) : ViewModel() {
    private val _state = MutableStateFlow<UiState>(UiState.Loading)
    val state: StateFlow<UiState> = _state.asStateFlow()

    fun load() {
        viewModelScope.launch {
            _state.value = runCatching { api.fetchMembers() }
                .fold({ UiState.Ready(it) }, { UiState.Error(it.message ?: "error") })
        }
    }
}`,
        exp: 'フラグの組み合わせには存在しない状態が混ざります。1つの型にすると取りうる状態が明確になります。' },

      { t: '集計を標準関数で書く',
        task: 'ループでの集計を、標準ライブラリの関数を使った形に直してください。',
        code: `fun topScorers(members: List<Member>): List<String> {
    val result = mutableListOf<String>()
    for (m in members) {
        if (m.score >= 70) {
            result.add(m.name)
        }
    }
    result.sort()
    return result
}`,
        answer: `fun topScorers(members: List<Member>, line: Int = 70): List<String> =
    members
        .asSequence()
        .filter { it.score >= line }
        .sortedByDescending { it.score }
        .map { it.name }
        .toList()

fun averageByTeam(members: List<Member>): Map<String, Double> =
    members.groupBy { it.team }.mapValues { (_, list) -> list.map { it.score }.average() }`,
        exp: '意図が関数名で表れます。要素が多いときは asSequence で中間リストの生成を抑えます。' },
    ],

    /* ================= Java ================= */
    java: [
      { t: 'equals と hashCode を揃える',
        task: '業務キーで等価性を判定し、hashCode も同じ項目から作るよう直してください。',
        code: `public class Member {
    private final String id;
    private final String name;

    public boolean equals(Object o) {
        Member other = (Member) o;
        return this.id == other.id;
    }
}`,
        answer: `public final class Member {
    private final String id;
    private final String name;

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof Member)) {
            return false;
        }
        Member other = (Member) o;
        return Objects.equals(id, other.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}`,
        exp: '文字列を == で比べると参照比較になります。equals と hashCode は同じ項目から作ります。' },

      { t: 'リソースを確実に閉じる',
        task: 'try-with-resources に直し、例外を握りつぶさない形にしてください。',
        code: `public List<String> readNames(String path) {
    List<String> names = new ArrayList<>();
    try {
        BufferedReader reader = new BufferedReader(new FileReader(path));
        String line;
        while ((line = reader.readLine()) != null) {
            names.add(line);
        }
        reader.close();
    } catch (IOException e) {
        e.printStackTrace();
    }
    return names;
}`,
        answer: `public List<String> readNames(Path path) throws IOException {
    List<String> names = new ArrayList<>();
    try (BufferedReader reader = Files.newBufferedReader(path, StandardCharsets.UTF_8)) {
        String line;
        while ((line = reader.readLine()) != null) {
            String trimmed = line.trim();
            if (!trimmed.isEmpty()) {
                names.add(trimmed);
            }
        }
    }
    return names;
}`,
        exp: '例外が起きても close されます。文字コードを明示し、失敗は呼び出し側へ伝えます。' },

      { t: 'ストリームで集計する',
        task: 'ループでの集計を Stream API に直し、しきい値を引数にしてください。',
        code: `public Map<String, Integer> countByTeam(List<Member> members) {
    Map<String, Integer> map = new HashMap<>();
    for (Member m : members) {
        if (m.getScore() >= 70) {
            Integer n = map.get(m.getTeam());
            if (n == null) {
                map.put(m.getTeam(), 1);
            } else {
                map.put(m.getTeam(), n + 1);
            }
        }
    }
    return map;
}`,
        answer: `public Map<String, Long> countByTeam(List<Member> members, int passLine) {
    return members.stream()
            .filter(Objects::nonNull)
            .filter(member -> member.getScore() >= passLine)
            .collect(Collectors.groupingBy(
                    Member::getTeam,
                    TreeMap::new,
                    Collectors.counting()));
}`,
        exp: '集計の意図が関数名で表れます。TreeMap を指定すればキー順も安定します。' },

      { t: '同時更新に耐える形にする',
        task: '複数スレッドから呼ばれても壊れないキャッシュに直してください。',
        code: `public class ScoreCache {
    private final Map<String, Integer> map = new HashMap<>();

    public int get(String id) {
        if (!map.containsKey(id)) {
            map.put(id, load(id));
        }
        return map.get(id);
    }
}`,
        answer: `public final class ScoreCache {
    private final ConcurrentMap<String, Integer> map = new ConcurrentHashMap<>();

    public int get(String id) {
        Objects.requireNonNull(id, "id");
        return map.computeIfAbsent(id, this::load);
    }

    public void invalidate(String id) {
        map.remove(id);
    }

    public int size() {
        return map.size();
    }
}`,
        exp: 'containsKey と put の間に割り込まれます。computeIfAbsent なら確認と登録が一度に行われます。' },

      { t: '値が無いことを型で表す',
        task: '見つからないときに null を返すのをやめ、Optional を返すよう直してください。',
        code: `public Member findById(String id) {
    for (Member m : members) {
        if (m.getId().equals(id)) {
            return m;
        }
    }
    return null;
}`,
        answer: `public Optional<Member> findById(String id) {
    if (id == null || id.isBlank()) {
        return Optional.empty();
    }
    return members.stream()
            .filter(member -> id.equals(member.getId()))
            .findFirst();
}

public String displayNameOf(String id) {
    return findById(id).map(Member::getName).orElse("unknown");
}`,
        exp: '戻り値が Optional なら未処理の null 参照が起きません。id 側を基準に equals すると null 安全です。' },

      { t: '入力を検証してから使う',
        task: '必須項目の検証を先に行い、問題があれば理由を添えて例外にしてください。',
        code: `public void register(Member member) {
    repository.save(member);
}`,
        answer: `public void register(Member member) {
    Objects.requireNonNull(member, "member");
    List<String> errors = new ArrayList<>();
    if (member.getId() == null || member.getId().isBlank()) {
        errors.add("id is required");
    }
    if (member.getName() == null || member.getName().isBlank()) {
        errors.add("name is required");
    }
    if (member.getScore() < 0 || member.getScore() > 100) {
        errors.add("score must be 0-100");
    }
    if (!errors.isEmpty()) {
        throw new IllegalArgumentException(String.join(", ", errors));
    }
    repository.save(member);
}`,
        exp: '検証をまとめて行うと、1件ずつ直す手戻りが減ります。理由を文字列で返すと原因が追えます。' },
    ],

    /* ================= Python ================= */
    python: [
      { t: '可変の既定値をやめる',
        task: '呼び出し間で共有されてしまう既定値を直し、型注釈も付けてください。',
        code: `def add_tag(tag, tags=[]):
    tags.append(tag)
    return tags`,
        answer: `from typing import Optional


def add_tag(tag: str, tags: Optional[list[str]] = None) -> list[str]:
    if tags is None:
        tags = []
    if not tag:
        raise ValueError("tag must not be empty")
    if tag in tags:
        return tags
    return [*tags, tag]`,
        exp: '既定値は定義時に一度だけ評価されます。None を既定にして関数内で生成します。' },

      { t: '後始末を確実にする',
        task: 'ファイルとロックを with 文で扱い、例外時も解放されるよう直してください。',
        code: `def export(path, rows):
    lock.acquire()
    f = open(path, "w")
    for row in rows:
        f.write(",".join(row) + "\\n")
    f.close()
    lock.release()`,
        answer: `import csv
from pathlib import Path


def export(path: Path, rows: list[list[str]]) -> int:
    written = 0
    with lock, path.open("w", encoding="utf-8", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["id", "name", "score"])
        for row in rows:
            writer.writerow(row)
            written += 1
    return written`,
        exp: '例外が起きても解放されます。csv モジュールを使うと区切り文字の扱いも任せられます。' },

      { t: '大きなデータをジェネレータで流す',
        task: '全件をメモリに載せる処理を、逐次処理に直してください。',
        code: `def load_scores(path):
    rows = open(path).readlines()
    result = []
    for row in rows:
        parts = row.strip().split(",")
        result.append(int(parts[1]))
    return result`,
        answer: `from collections.abc import Iterator
from pathlib import Path


def load_scores(path: Path) -> Iterator[int]:
    with path.open(encoding="utf-8") as f:
        next(f, None)
        for line in f:
            parts = line.strip().split(",")
            if len(parts) < 2:
                continue
            try:
                yield int(parts[1])
            except ValueError:
                continue


def average_score(path: Path) -> float:
    scores = list(load_scores(path))
    return sum(scores) / len(scores) if scores else 0.0`,
        exp: 'yield なら1行ずつ処理できます。壊れた行は読み飛ばして全体を止めません。' },

      { t: '例外を絞って捕まえる',
        task: '広すぎる except をやめ、想定した例外だけを扱うよう直してください。',
        code: `def fetch_member(member_id):
    try:
        res = requests.get(API + "/members/" + member_id)
        return res.json()
    except:
        return None`,
        answer: `import logging

import requests

logger = logging.getLogger(__name__)


def fetch_member(member_id: str) -> dict | None:
    try:
        res = requests.get(f"{API}/members/{member_id}", timeout=10)
        res.raise_for_status()
        return res.json()
    except requests.Timeout:
        logger.warning("timeout: %s", member_id)
        return None
    except requests.HTTPError as e:
        logger.warning("http %s: %s", e.response.status_code, member_id)
        return None`,
        exp: '裸の except は中断や記述ミスまで飲み込みます。タイムアウトの指定も忘れがちです。' },

      { t: 'データクラスにまとめる',
        task: '辞書でやり取りしている値を、検証付きのデータクラスに直してください。',
        code: `def make_member(row):
    return {"id": row[0], "name": row[1], "score": int(row[2])}


def is_passed(member):
    return member["score"] >= 70`,
        answer: `from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class Member:
    id: str
    name: str
    score: int

    def __post_init__(self) -> None:
        if not self.id:
            raise ValueError("id is required")
        if not 0 <= self.score <= 100:
            raise ValueError("score must be 0-100")

    @property
    def is_passed(self) -> bool:
        return self.score >= 70


def make_member(row: list[str]) -> Member:
    return Member(id=row[0], name=row[1], score=int(row[2]))`,
        exp: 'キーの打ち間違いが無くなり、生成時に検証できます。frozen で不変にできます。' },

      { t: '集計を標準ライブラリで書く',
        task: '手書きのループを、標準ライブラリの機能に置き換えてください。',
        code: `def count_by_team(members):
    result = {}
    for m in members:
        if m.score >= 70:
            if m.team in result:
                result[m.team] += 1
            else:
                result[m.team] = 1
    return result`,
        answer: `from collections import Counter


def count_by_team(members: list[Member], pass_line: int = 70) -> dict[str, int]:
    passed = (m for m in members if m.score >= pass_line)
    counter = Counter(m.team for m in passed)
    return dict(counter.most_common())


def top_members(members: list[Member], limit: int = 5) -> list[Member]:
    return sorted(members, key=lambda m: m.score, reverse=True)[:limit]`,
        exp: 'Counter は集計の定番です。most_common で件数の多い順に並べられます。' },
    ],

    /* ================= PHP ================= */
    php: [
      { t: 'SQLを安全に組み立てる',
        task: '文字列連結をやめ、プリペアドステートメントで値を束縛してください。',
        code: `function findMembers(PDO $pdo, $team, $minScore) {
    $sql = "SELECT * FROM members WHERE team = '" . $team . "' AND score >= " . $minScore;
    return $pdo->query($sql)->fetchAll();
}`,
        answer: `function findMembers(PDO $pdo, string $team, int $minScore): array
{
    $sql = 'SELECT id, name, team, score FROM members'
         . ' WHERE team = :team AND score >= :score'
         . ' ORDER BY score DESC';
    $stmt = $pdo->prepare($sql);
    $stmt->bindValue(':team', $team, PDO::PARAM_STR);
    $stmt->bindValue(':score', $minScore, PDO::PARAM_INT);
    $stmt->execute();

    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}`,
        exp: '値とSQL文を分けて渡すため、入力がSQLとして解釈されません。取得列も明示します。' },

      { t: '型と例外を明示する',
        task: '引数と戻り値に型を付け、失敗時は専用の例外を投げるよう直してください。',
        code: `function parseScore($value) {
    if (!is_numeric($value)) {
        return false;
    }
    return intval($value);
}`,
        answer: `final class InvalidScoreException extends InvalidArgumentException
{
}

function parseScore(mixed $value): int
{
    if (!is_numeric($value)) {
        throw new InvalidScoreException('score must be numeric');
    }
    $score = (int) $value;
    if ($score < 0 || $score > 100) {
        throw new InvalidScoreException('score must be 0-100');
    }

    return $score;
}`,
        exp: 'false を返すと 0 と区別できません。専用の例外なら呼び出し側で扱いを分けられます。' },

      { t: 'トランザクションで囲む',
        task: '複数の更新をまとめ、失敗したら元に戻すよう直してください。',
        code: `function transfer(PDO $pdo, $fromId, $toId, $points) {
    $pdo->exec("UPDATE members SET score = score - $points WHERE id = $fromId");
    $pdo->exec("UPDATE members SET score = score + $points WHERE id = $toId");
}`,
        answer: `function transfer(PDO $pdo, string $fromId, string $toId, int $points): void
{
    if ($points <= 0) {
        throw new InvalidArgumentException('points must be positive');
    }
    $pdo->beginTransaction();
    try {
        $sub = $pdo->prepare('UPDATE members SET score = score - :p WHERE id = :id');
        $sub->execute([':p' => $points, ':id' => $fromId]);

        $add = $pdo->prepare('UPDATE members SET score = score + :p WHERE id = :id');
        $add->execute([':p' => $points, ':id' => $toId]);

        $pdo->commit();
    } catch (Throwable $e) {
        $pdo->rollBack();
        throw $e;
    }
}`,
        exp: '片方だけ成功する状態を防ぎます。例外は握りつぶさず呼び出し側へ再送出します。' },

      { t: '出力をエスケープする',
        task: 'HTMLへ出す値をエスケープし、文字コードも明示してください。',
        code: `function renderRow($member) {
    echo "<tr><td>" . $member['name'] . "</td>"
       . "<td>" . $member['team'] . "</td></tr>";
}`,
        answer: `function h(?string $value): string
{
    return htmlspecialchars($value ?? '', ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

function renderRow(array $member): void
{
    printf(
        '<tr><td>%s</td><td>%s</td><td>%d</td></tr>',
        h($member['name'] ?? null),
        h($member['team'] ?? null),
        (int) ($member['score'] ?? 0)
    );
}`,
        exp: 'エスケープを関数にまとめると書き漏れを防げます。ENT_QUOTES で属性値も安全になります。' },

      { t: '配列処理を宣言的に書く',
        task: 'ループでの絞り込みと変換を、配列関数で書き直してください。',
        code: `function passedNames($members) {
    $names = array();
    foreach ($members as $m) {
        if ($m['score'] >= 70) {
            $names[] = $m['name'];
        }
    }
    return $names;
}`,
        answer: `function passedNames(array $members, int $passLine = 70): array
{
    $passed = array_filter(
        $members,
        static fn (array $m): bool => ($m['score'] ?? 0) >= $passLine
    );
    $names = array_map(static fn (array $m): string => (string) $m['name'], $passed);

    return array_values($names);
}`,
        exp: 'array_filter はキーを保つため、array_values で詰め直します。静的クロージャで束縛を避けます。' },

      { t: '依存を注入する',
        task: 'クラス内で直接生成している依存を、コンストラクタで受け取る形に直してください。',
        code: `class MemberService {
    public function register($data) {
        $pdo = new PDO(DSN, USER, PASS);
        $repo = new MemberRepository($pdo);
        return $repo->save($data);
    }
}`,
        answer: `final class MemberService
{
    public function __construct(
        private readonly MemberRepository $repository,
        private readonly LoggerInterface $logger,
    ) {
    }

    public function register(array $data): string
    {
        $id = $this->repository->save($data);
        $this->logger->info('member registered', ['id' => $id]);

        return $id;
    }
}`,
        exp: '依存を外から渡すと差し替えやすく、テストで偽物を入れられます。読み取り専用で不変にします。' },
    ],

    /* ================= TypeScript ================= */
    ts: [
      { t: 'any をやめて型で守る',
        task: '外部から来る値を unknown で受け、型ガードで絞り込んでください。',
        code: `function toMember(data: any): Member {
    return { id: data.id, name: data.name, score: data.score };
}`,
        answer: `type Member = {
  readonly id: string;
  readonly name: string;
  readonly score: number;
};

function isMember(value: unknown): value is Member {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return typeof v.id === "string"
    && typeof v.name === "string"
    && typeof v.score === "number";
}

function toMember(data: unknown): Member {
  if (!isMember(data)) {
    throw new TypeError("invalid member payload");
  }
  return data;
}`,
        exp: 'any は型チェックを無効にします。unknown なら絞り込みを強制でき、境界で不正な値を弾けます。' },

      { t: '取りうる状態を型で表す',
        task: 'フラグの組み合わせをやめ、判別可能なユニオンに直してください。',
        code: `type State = {
  loading: boolean;
  error?: string;
  members?: Member[];
};`,
        answer: `type State =
  | { readonly status: "loading" }
  | { readonly status: "ready"; readonly members: readonly Member[] }
  | { readonly status: "error"; readonly message: string };

function render(state: State): string {
  switch (state.status) {
    case "loading":
      return "loading...";
    case "ready":
      return state.members.length + " members";
    case "error":
      return "error: " + state.message;
  }
}`,
        exp: 'フラグの組み合わせには存在しない状態が混ざります。判別子があれば分岐の漏れも検出できます。' },

      { t: 'ジェネリクスに制約を付ける',
        task: '型引数に制約を付け、キーの指定を型安全にしてください。',
        code: `function pluck(items: any[], key: string): any[] {
    return items.map(item => item[key]);
}`,
        answer: `function pluck<T extends object, K extends keyof T>(
  items: readonly T[],
  key: K,
): Array<T[K]> {
  return items.map((item) => item[key]);
}

function groupBy<T, K extends string>(
  items: readonly T[],
  toKey: (item: T) => K,
): Record<K, T[]> {
  return items.reduce((acc, item) => {
    const key = toKey(item);
    (acc[key] ??= []).push(item);
    return acc;
  }, {} as Record<K, T[]>);
}`,
        exp: 'keyof で存在するキーだけを受け付けられます。戻り値の型も自動で決まります。' },

      { t: '非同期の失敗を型で扱う',
        task: '例外を投げる代わりに、成功と失敗を型で返すよう直してください。',
        code: `async function fetchMembers(): Promise<Member[]> {
    const res = await fetch("/api/members");
    return res.json();
}`,
        answer: `type Result<T, E = Error> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };

async function fetchMembers(): Promise<Result<Member[]>> {
  try {
    const res = await fetch("/api/members");
    if (!res.ok) {
      return { ok: false, error: new Error("HTTP " + res.status) };
    }
    const data: unknown = await res.json();
    if (!Array.isArray(data) || !data.every(isMember)) {
      return { ok: false, error: new TypeError("invalid payload") };
    }
    return { ok: true, value: data };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e : new Error(String(e)) };
  }
}`,
        exp: 'res.ok の確認と中身の検証が抜けがちです。戻り値の型で失敗の扱いを促せます。' },

      { t: '定数を型として使う',
        task: '文字列の直書きをやめ、as const から型を導いてください。',
        code: `const STATUS = {
    draft: "draft",
    review: "in review",
    done: "done",
};

function label(status: string): string {
    return STATUS[status];
}`,
        answer: `const STATUS = {
  draft: "draft",
  review: "in review",
  done: "done",
} as const;

type StatusKey = keyof typeof STATUS;
type StatusLabel = (typeof STATUS)[StatusKey];

function label(status: StatusKey): StatusLabel {
  return STATUS[status];
}

function isStatusKey(value: string): value is StatusKey {
  return value in STATUS;
}`,
        exp: 'as const でリテラル型になります。未知のキーをコンパイル時に弾けます。' },

      { t: '読み取り専用で守る',
        task: '引数のオブジェクトを変更しない形に直し、更新は新しい値を返してください。',
        code: `function addScore(member: Member, delta: number): Member {
    member.score = member.score + delta;
    return member;
}`,
        answer: `type Member = {
  readonly id: string;
  readonly name: string;
  readonly score: number;
};

function addScore(member: Readonly<Member>, delta: number): Member {
  if (!Number.isFinite(delta)) {
    throw new RangeError("delta must be a finite number");
  }
  const next = Math.min(100, Math.max(0, member.score + delta));
  return { ...member, score: next };
}`,
        exp: '引数を書き換えると呼び出し側に影響します。新しい値を返すと副作用が無くなります。' },
    ],

    /* ================= JavaScript ================= */
    js: [
      { t: '並行して取得する',
        task: '直列に待っている取得を並行にし、全件の成否を扱えるよう直してください。',
        code: `async function loadAll(ids) {
    const result = [];
    for (const id of ids) {
        const res = await fetch("/api/members/" + id);
        result.push(await res.json());
    }
    return result;
}`,
        answer: `async function loadAll(ids) {
  const settled = await Promise.allSettled(
    ids.map(async (id) => {
      const res = await fetch("/api/members/" + encodeURIComponent(id));
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res.json();
    }),
  );
  return {
    members: settled.filter((s) => s.status === "fulfilled").map((s) => s.value),
    errors: settled.filter((s) => s.status === "rejected").map((s) => s.reason),
  };
}`,
        exp: '直列だと件数ぶん待ちます。allSettled なら一部が失敗しても残りを取得できます。' },

      { t: 'リスナを解除できるようにする',
        task: '解除漏れを防ぐため、AbortController でまとめて外せるよう直してください。',
        code: `function setup(el) {
    el.addEventListener("click", onClick);
    window.addEventListener("resize", onResize);
    document.addEventListener("scroll", onScroll);
}`,
        answer: `function setup(el) {
  const controller = new AbortController();
  const { signal } = controller;

  el.addEventListener("click", onClick, { signal });
  window.addEventListener("resize", onResize, { signal, passive: true });
  document.addEventListener("scroll", onScroll, { signal, passive: true });

  return () => controller.abort();
}`,
        exp: '登録ごとに解除を書くと漏れます。signal を渡せば abort で一括解除できます。' },

      { t: '深い入れ子を安全に読む',
        task: '存在しない可能性のある値を、省略可能連結と既定値で読むよう直してください。',
        code: `function teamName(member) {
    if (member && member.profile && member.profile.team) {
        return member.profile.team.name;
    }
    return "no team";
}`,
        answer: `function teamName(member) {
  return member?.profile?.team?.name ?? "no team";
}

function scoreOf(member) {
  const raw = member?.result?.score;
  return typeof raw === "number" && Number.isFinite(raw) ? raw : 0;
}`,
        exp: '?. と ?? で分岐が消えます。?? は null と undefined のときだけ既定値を返します。' },

      { t: '連続する入力を間引く',
        task: '入力のたびに走る処理を、一定時間まとめて実行するよう直してください。',
        code: `input.addEventListener("input", () => {
    search(input.value);
});`,
        answer: `function debounce(fn, waitMs) {
  let timer = null;
  return (...args) => {
    if (timer !== null) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      fn(...args);
    }, waitMs);
  };
}

const onInput = debounce((value) => search(value), 300);
input.addEventListener("input", (e) => onInput(e.target.value));`,
        exp: '打鍵ごとに通信すると負荷も表示のちらつきも増えます。最後の入力から一定時間待って実行します。' },

      { t: '集計をまとめる',
        task: 'ループでの集計を、配列メソッドで書き直してください。',
        code: `function summary(members) {
    let total = 0;
    let count = 0;
    const teams = {};
    for (let i = 0; i < members.length; i++) {
        total += members[i].score;
        count++;
        if (teams[members[i].team]) {
            teams[members[i].team]++;
        } else {
            teams[members[i].team] = 1;
        }
    }
    return { average: total / count, teams: teams };
}`,
        answer: `function summary(members) {
  if (members.length === 0) {
    return { average: 0, teams: {} };
  }
  const total = members.reduce((sum, m) => sum + m.score, 0);
  const teams = members.reduce((acc, m) => {
    acc[m.team] = (acc[m.team] ?? 0) + 1;
    return acc;
  }, {});
  return {
    average: Math.round((total / members.length) * 10) / 10,
    teams,
  };
}`,
        exp: '空配列での0除算を先に弾きます。reduce で集計の意図をまとめられます。' },

      { t: '例外を握りつぶさない',
        task: '失敗の理由を残し、呼び出し側が扱えるよう直してください。',
        code: `async function save(member) {
    try {
        await fetch("/api/members", { method: "POST", body: JSON.stringify(member) });
    } catch (e) {
        console.log("error");
    }
}`,
        answer: `class SaveError extends Error {
  constructor(message, options) {
    super(message, options);
    this.name = "SaveError";
  }
}

async function save(member) {
  try {
    const res = await fetch("/api/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(member),
    });
    if (!res.ok) {
      throw new SaveError("HTTP " + res.status);
    }
    return await res.json();
  } catch (cause) {
    throw new SaveError("failed to save member", { cause });
  }
}`,
        exp: 'ログを出して終わると呼び出し側は成功と区別できません。cause で元の例外も残します。' },
    ],

    /* ================= HTML ================= */
    html: [
      { t: 'フォームを使える形にする',
        task: 'ラベルと入力欄を対応付け、入力の種類と補完を指定してください。',
        code: `<div>
  <span>Email</span>
  <input type="text" id="email">
  <span>Password</span>
  <input type="text" id="pw">
  <div onclick="submit()">Send</div>
</div>`,
        answer: `<form action="/login" method="post">
  <div class="field">
    <label for="email">Email</label>
    <input type="email" id="email" name="email"
           autocomplete="email" required>
  </div>
  <div class="field">
    <label for="password">Password</label>
    <input type="password" id="password" name="password"
           autocomplete="current-password" required minlength="8">
  </div>
  <button type="submit">Send</button>
</form>`,
        exp: 'label の for で読み上げと対応付きます。type と autocomplete で入力の手間が減ります。' },

      { t: '文書構造を整える',
        task: 'div の羅列をセマンティックな要素に置き換えてください。',
        code: `<div class="top">
  <div class="logo">SkillCheck</div>
  <div class="menu">
    <div><a href="/">Home</a></div>
    <div><a href="/exam">Exam</a></div>
  </div>
</div>
<div class="body">
  <div class="title">Result</div>
  <div class="text">Your score is 82.</div>
</div>`,
        answer: `<header class="top">
  <h1 class="logo">SkillCheck</h1>
  <nav class="menu" aria-label="Global">
    <ul>
      <li><a href="/">Home</a></li>
      <li><a href="/exam">Exam</a></li>
    </ul>
  </nav>
</header>

<main class="body">
  <article>
    <h2 class="title">Result</h2>
    <p class="text">Your score is 82.</p>
  </article>
</main>`,
        exp: 'ランドマークとして拾われ、見出しの階層も伝わります。クラス名は変えずに要素だけ置き換えます。' },

      { t: '画像の読み込みを最適化する',
        task: '代替テキスト、寸法、遅延読み込み、候補画像を指定してください。',
        code: `<img src="/img/hero.png">
<img src="/img/icon.png">`,
        answer: `<img src="/img/hero.png"
     srcset="/img/hero.png 1x, /img/hero@2x.png 2x"
     width="1200" height="600"
     alt="Team working on a skill check"
     fetchpriority="high">

<img src="/img/icon.png"
     width="24" height="24"
     alt=""
     loading="lazy"
     decoding="async">`,
        exp: '幅と高さを書くとレイアウトのずれを防げます。装飾画像は alt="" で読み上げから外します。' },

      { t: 'テーブルを読み上げられる形にする',
        task: '見出しセルと範囲、説明を付けてください。',
        code: `<table>
  <tr>
    <td>Name</td>
    <td>Score</td>
  </tr>
  <tr>
    <td>Sato</td>
    <td>82</td>
  </tr>
</table>`,
        answer: `<table>
  <caption>Exam results for October</caption>
  <thead>
    <tr>
      <th scope="col">Name</th>
      <th scope="col">Score</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th scope="row">Sato</th>
      <td>82</td>
    </tr>
  </tbody>
</table>`,
        exp: 'scope で見出しとデータの対応が伝わります。caption は表の目的を示します。' },

      { t: 'スクリプトの読み込みを直す',
        task: '描画を妨げない読み込みにし、依存のあるものは順序を保ってください。',
        code: `<head>
  <script src="/js/lib.js"></script>
  <script src="/js/app.js"></script>
  <script src="/js/analytics.js"></script>
</head>`,
        answer: `<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="preload" href="/js/lib.js" as="script">
  <script src="/js/lib.js" defer></script>
  <script src="/js/app.js" defer></script>
  <script src="/js/analytics.js" async></script>
</head>`,
        exp: 'defer は記述順を保ってDOM構築後に実行します。独立した計測は async で構いません。' },

      { t: '見出しと領域に名前を付ける',
        task: '複数の領域を区別できるよう、見出しと参照を付けてください。',
        code: `<section>
  <h2>Choice</h2>
  <div>...</div>
</section>
<section>
  <h2>Code</h2>
  <div>...</div>
</section>`,
        answer: `<section aria-labelledby="choice-title">
  <h2 id="choice-title">Choice questions</h2>
  <p>Pick the best answer for each question.</p>
</section>

<section aria-labelledby="code-title">
  <h2 id="code-title">Code questions</h2>
  <p>Rewrite the code as shown in the sample answer.</p>
</section>`,
        exp: 'aria-labelledby で領域に名前が付き、見出し単位で移動できます。id は重複させません。' },
    ],

    /* ================= AWS ================= */
    aws: [
      { t: '最小権限のポリシーにする',
        task: '読み取りだけを許可し、対象のバケットと接頭辞に絞ってください。',
        code: `{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "s3:*",
      "Resource": "*"
    }
  ]
}`,
        answer: `{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "ListBucketWithPrefix",
      "Effect": "Allow",
      "Action": "s3:ListBucket",
      "Resource": "arn:aws:s3:::lg-reports",
      "Condition": {
        "StringLike": { "s3:prefix": ["exports/*"] }
      }
    },
    {
      "Sid": "ReadObjects",
      "Effect": "Allow",
      "Action": ["s3:GetObject"],
      "Resource": "arn:aws:s3:::lg-reports/exports/*"
    }
  ]
}`,
        exp: 'ListBucket はバケット本体、GetObject は配下が対象です。接頭辞で範囲をさらに絞れます。' },

      { t: '公開を塞ぐ',
        task: 'パブリックアクセスを4項目すべて塞ぎ、暗号化とバージョニングも有効にしてください。',
        code: `aws s3api put-public-access-block \\
  --bucket lg-reports \\
  --public-access-block-configuration BlockPublicAcls=false`,
        answer: `aws s3api put-public-access-block \\
  --bucket lg-reports \\
  --public-access-block-configuration \\
    BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true

aws s3api put-bucket-versioning \\
  --bucket lg-reports \\
  --versioning-configuration Status=Enabled

aws s3api put-bucket-encryption \\
  --bucket lg-reports \\
  --server-side-encryption-configuration \\
    '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}'`,
        exp: '4項目すべてを有効にしないと、ACLやポリシー経由で公開される余地が残ります。' },

      { t: 'テンプレートに設定を足す',
        task: 'CloudFormation のバケット定義に、暗号化・バージョニング・ライフサイクルを足してください。',
        code: `Resources:
  ReportsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: lg-reports`,
        answer: `Resources:
  ReportsBucket:
    Type: AWS::S3::Bucket
    DeletionPolicy: Retain
    Properties:
      BucketName: lg-reports
      VersioningConfiguration:
        Status: Enabled
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        IgnorePublicAcls: true
        BlockPublicPolicy: true
        RestrictPublicBuckets: true
      LifecycleConfiguration:
        Rules:
          - Id: ExpireOldExports
            Status: Enabled
            Prefix: exports/
            ExpirationInDays: 90`,
        exp: 'DeletionPolicy を Retain にするとスタック削除で消えません。保管期間はライフサイクルで管理します。' },

      { t: '関数の設定を揃える',
        task: 'Lambda にメモリ・タイムアウト・環境変数・同時実行数をまとめて設定してください。',
        code: `aws lambda update-function-configuration \\
  --function-name lg-export`,
        answer: `aws lambda update-function-configuration \\
  --function-name lg-export \\
  --memory-size 1024 \\
  --timeout 60 \\
  --environment "Variables={STAGE=prod,BUCKET=lg-reports,LOG_LEVEL=info}"

aws lambda put-function-concurrency \\
  --function-name lg-export \\
  --reserved-concurrent-executions 10

aws lambda put-provisioned-concurrency-config \\
  --function-name lg-export \\
  --qualifier live \\
  --provisioned-concurrent-executions 2`,
        exp: '環境変数は置き換えになるため既存ごと指定します。同時実行の予約で他の関数への影響を抑えます。' },

      { t: '通信経路を絞る',
        task: 'セキュリティグループで、ALBからの通信だけをアプリのポートに通してください。',
        code: `aws ec2 authorize-security-group-ingress \\
  --group-id sg-app \\
  --protocol tcp --port 8080 --cidr 0.0.0.0/0`,
        answer: `aws ec2 authorize-security-group-ingress \\
  --group-id sg-app \\
  --ip-permissions '[
    {
      "IpProtocol": "tcp",
      "FromPort": 8080,
      "ToPort": 8080,
      "UserIdGroupPairs": [
        { "GroupId": "sg-alb", "Description": "from ALB only" }
      ]
    }
  ]'

aws ec2 revoke-security-group-ingress \\
  --group-id sg-app \\
  --protocol tcp --port 8080 --cidr 0.0.0.0/0`,
        exp: 'CIDR ではなく参照元のセキュリティグループを指定すると、IPの変化に影響されません。' },

      { t: 'アラームを設定する',
        task: 'エラー率とレイテンシを監視し、通知先を指定するアラームを作ってください。',
        code: `aws cloudwatch put-metric-alarm \\
  --alarm-name lg-export-errors \\
  --metric-name Errors`,
        answer: `aws cloudwatch put-metric-alarm \\
  --alarm-name lg-export-errors \\
  --namespace AWS/Lambda \\
  --metric-name Errors \\
  --dimensions Name=FunctionName,Value=lg-export \\
  --statistic Sum \\
  --period 300 \\
  --evaluation-periods 2 \\
  --threshold 5 \\
  --comparison-operator GreaterThanOrEqualToThreshold \\
  --treat-missing-data notBreaching \\
  --alarm-actions arn:aws:sns:ap-northeast-1:123456789012:lg-alerts`,
        exp: '名前空間とディメンションが無いと対象が定まりません。欠損値の扱いも明示します。' },
    ],
  };

  root.SC_CODE = CODE;
})(typeof window !== 'undefined' ? window : this);

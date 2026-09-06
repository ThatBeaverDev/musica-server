package indexer

type IndexingIssue int

const (
	IssueNoTitle IndexingIssue = iota
	IssueInvalidRelease
	IssueNoCover
)

var Issues = map[IndexingIssue]string{
	IssueNoTitle:        "issue:no_title",
	IssueInvalidRelease: "issue:bad_release",
	IssueNoCover:        "issue:no_cover",
}

type Issue struct {
	name  string
	track *Track
}

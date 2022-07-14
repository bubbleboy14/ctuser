from cantools.util import log, read
from cantools import config

def getWPQuery():
	cfg = config.ctuser.wpmail
	q = getattr(cfg, "query") or "SELECT user_email FROM wp_users"
	j = getattr(cfg, "join")
	if j:
		q = "%s JOIN %s"%(q, j)
	return q

def getWPmails():
    import pymysql
    h, u, p, d = read(".c").strip().split("|")
    log("extracting email list from WP", 1)
    conn = pymysql.connect(host=h, user=u, passwd=p, db=d)
    cur = conn.cursor()
    cur.execute(getWPQuery())
    rowz = cur.fetchall()
    log("found %s recipients"%(len(rowz),), 1)
    return [r[0] for r in rowz]


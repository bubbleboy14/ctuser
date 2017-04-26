def getWPmails():
    import MySQLdb
    h, u, p, d = read(".c").strip().split("|")
    log("extracting email list from WP", 1)
    conn = MySQLdb.connect(host=h, user=u, passwd=p, db=d)
    cur = conn.cursor()
    cur.execute("SELECT user_email FROM wp_users")
    rowz = cur.fetchall()
    log("found %s recipients"%(len(rowz),), 1)
    return [r[0] for r in rowz]


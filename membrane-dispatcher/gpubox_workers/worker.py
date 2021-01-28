import time


def play(id):
    for i in range(10):
        print(f"Something.. {i} for {id}")
        with open(f"tmp{i}", "w+") as f:
            f.write("Now the file has more content!")

# if __name__=="__main__":
# 	func()

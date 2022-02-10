def is_power_of_2(number):
    if number == 1:
        return True

    if number % 2 == 1:
        return False

    return is_power_of_2(number / 2)

def a_implies_b(a:bool, b:bool):
    return (not a or b)

def a_if_and_only_if_b(a:bool, b:bool):
    return a_implies_b(a, b) and a_implies_b(b, a)